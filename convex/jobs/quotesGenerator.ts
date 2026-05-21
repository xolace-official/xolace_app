import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

const BATCH_SIZE = 20;

function utcDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Load the next batch of emotional profiles to process for daily quotes.
 * "Active" = has quotes preferences set OR at least 1 session in last 30 days.
 */
export const getNextBatch = internalQuery({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("emotional_profiles")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor });

    return {
      page: result.page.map((p) => p._id),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Check if a profile qualifies for daily quote generation.
 * Must have quotes prefs set OR session in last 30 days.
 */
export const isProfileActive = internalQuery({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
  },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId)
      )
      .unique();

    // Has quotes preferences → always active for generation
    if (prefs?.quotes !== undefined) return { active: true, prefs };

    // No prefs — check for recent session
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSession = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q
          .eq("emotionalProfileId", args.emotionalProfileId)
          .gte("createdAt", thirtyDaysAgo)
      )
      .first();

    return { active: !!recentSession, prefs };
  },
});

/**
 * Process one user: generate session-derived + curated quotes.
 */
export const processUser = internalAction({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
  },
  handler: async (ctx, args) => {
    const date = utcDateString();

    // Skip if already has quotes today (idempotency)
    const alreadyDone: boolean = await ctx.runQuery(
      internal.dailyQuotes.hasQuotesForToday,
      { emotionalProfileId: args.emotionalProfileId, date }
    );
    if (alreadyDone) {
      console.log(
        `[quotesGenerator:processUser] Already has quotes for ${args.emotionalProfileId} on ${date}, skipping`
      );
      return;
    }

    const { active, prefs }: { active: boolean; prefs: { quotes?: { themes: string[]; notificationEnabled: boolean; notificationTime?: string; shownQuoteIds: string[] } } | null } =
      await ctx.runQuery(internal.jobs.quotesGenerator.isProfileActive, {
        emotionalProfileId: args.emotionalProfileId,
      });

    if (!active) return;

    // 1. Attempt session-derived quote (best-effort, no retry)
    await ctx.runAction(internal.ai.quotesDistiller.generateForUser, {
      emotionalProfileId: args.emotionalProfileId,
      date,
    });

    // 2. Always generate curated quote
    const themes = prefs?.quotes?.themes ?? [];
    const shownQuoteIds = (prefs?.quotes?.shownQuoteIds ?? []) as any[];

    const curatedQuote: { _id: string; text: string } | null = await ctx.runQuery(
      internal.quotes.pickCuratedQuote,
      {
        emotionalProfileId: args.emotionalProfileId,
        themes,
        shownQuoteIds,
      }
    );

    if (curatedQuote) {
      await ctx.runMutation(internal.dailyQuotes.store, {
        emotionalProfileId: args.emotionalProfileId,
        date,
        type: "curated",
        text: curatedQuote.text,
      });

      // Track shown quote ID in preferences to avoid repeats
      if (prefs?.quotes !== undefined) {
        await ctx.runMutation(internal.jobs.quotesGenerator.markQuoteShown, {
          emotionalProfileId: args.emotionalProfileId,
          quoteId: curatedQuote._id as any,
        });
      }
    }

    console.log(
      `[quotesGenerator:processUser] Done for ${args.emotionalProfileId} on ${date}`
    );
  },
});

/**
 * Append a curated quote ID to the shown list in preferences.
 */
export const markQuoteShown = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId)
      )
      .unique();

    if (!prefs?.quotes) return;

    const currentShown = prefs.quotes.shownQuoteIds ?? [];
    // Cap at 500 to stay well under document size limit
    const updated = [...currentShown, args.quoteId].slice(-500);

    await ctx.db.patch(prefs._id, {
      quotes: { ...prefs.quotes, shownQuoteIds: updated },
    });
  },
});

/**
 * Nightly cron entry point. Paginates through all profiles,
 * dispatching processUser per user. Loops until isDone.
 */
export const generateForNextBatch = internalAction({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const isProd = process.env.CONVEX_ENV === "production";
    if (!isProd) {
      console.log("[quotesGenerator] Not production, skipping nightly run");
      return;
    }

    const { page, isDone, continueCursor }: {
      page: string[];
      isDone: boolean;
      continueCursor: string;
    } = await ctx.runQuery(internal.jobs.quotesGenerator.getNextBatch, {
      cursor: args.cursor,
    });

    // Dispatch one action per user (avoids single-action timeout)
    for (const profileId of page) {
      await ctx.scheduler.runAfter(
        0,
        internal.jobs.quotesGenerator.processUser,
        { emotionalProfileId: profileId as any }
      );
    }

    console.log(
      `[quotesGenerator] Dispatched ${page.length} users, isDone=${isDone}`
    );

    // Continue pagination if not done
    if (!isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.jobs.quotesGenerator.generateForNextBatch,
        { cursor: continueCursor }
      );
    }
  },
});
