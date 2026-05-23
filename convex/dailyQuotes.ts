import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { internal } from "./_generated/api";

function utcDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get today's quotes for the authenticated user.
 * Returns session-derived and/or curated quote for today.
 */
export const getToday = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const today = utcDateString();

    console.log("today ", today)

    const [quotes, sessionToday] = await Promise.all([
      ctx.db
        .query("daily_quotes")
        .withIndex("by_profile_date", (q) =>
          q.eq("emotionalProfileId", profile._id).eq("date", today)
        )
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("by_profile_time", (q) =>
          q
            .eq("emotionalProfileId", profile._id)
            .gte("createdAt", new Date(today + "T00:00:00Z").getTime())
        )
        .filter((q) => q.eq(q.field("state"), "completed"))
        .first(),
    ]);

    console.log("quotes ", quotes)

    return {
      session: quotes.find((q) => q.type === "session") ?? null,
      curated: quotes.find((q) => q.type === "curated") ?? null,
      hasSessionToday: sessionToday !== null,
    };
  },
});

/**
 * Set a reaction on today's displayed quote.
 * Pass quoteId of whichever quote is currently shown.
 */
export const react = mutation({
  args: {
    quoteId: v.id("daily_quotes"),
    reaction: v.union(v.literal("resonates"), v.literal("not_today")),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) throw new Error("Quote not found");
    if (quote.emotionalProfileId !== profile._id) {
      throw new Error("Not your quote");
    }

    await ctx.db.patch(args.quoteId, { reaction: args.reaction });
    return null;
  },
});

/**
 * Clear a reaction (toggle off).
 */
export const clearReaction = mutation({
  args: { quoteId: v.id("daily_quotes") },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) throw new Error("Quote not found");
    if (quote.emotionalProfileId !== profile._id) {
      throw new Error("Not your quote");
    }

    await ctx.db.patch(args.quoteId, { reaction: undefined });
    return null;
  },
});

/**
 * Internal: store a generated quote for a user.
 * Idempotent — skips if a quote of this type already exists for this date.
 */
export const store = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    date: v.string(),
    type: v.union(v.literal("session"), v.literal("curated")),
    text: v.string(),
    sessionContextIds: v.optional(v.array(v.id("sessions"))),
  },
  handler: async (ctx, args) => {
    // Idempotency check
    const existing = await ctx.db
      .query("daily_quotes")
      .withIndex("by_profile_date_type", (q) =>
        q
          .eq("emotionalProfileId", args.emotionalProfileId)
          .eq("date", args.date)
          .eq("type", args.type)
      )
      .unique();

    if (existing) {
      console.log(
        `[dailyQuotes:store] Already exists for ${args.emotionalProfileId} ${args.date} ${args.type}, skipping`
      );
      return existing._id;
    }

    const id = await ctx.db.insert("daily_quotes", {
      emotionalProfileId: args.emotionalProfileId,
      date: args.date,
      type: args.type,
      text: args.text,
      sessionContextIds: args.sessionContextIds,
      isPremium: false,
      reaction: undefined,
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * Cold-start: immediately generate today's quotes for the current user.
 * Called when the user first visits the quotes screen or has no quotes today.
 */
export const coldStart = action({
  args: {},
  handler: async (ctx) => {
    console.log(`[dailyQuotes:coldStart] Starting cold start`);
    
    const profile: { _id: string } | null = await ctx.runQuery(
      internal.dailyQuotes.getMyProfile,
      {}
    );
    if (!profile) throw new Error("Not authenticated");

    // Schedule instead of awaiting — processUser calls Anthropic and can take
    // 30s+, which drops the WebSocket. The reactive getToday query pushes the
    // update to the client automatically when quotes land.
    await ctx.scheduler.runAfter(0, internal.jobs.quotesGenerator.processUser, {
      emotionalProfileId: profile._id as any,
    });
    return null;
  },
});

/**
 * Internal: get the authenticated user's emotional profile.
 */
export const getMyProfile = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.accountStatus !== "active") return null;
    const profile = await ctx.db.get(user.emotionalProfileId);
    return profile ? { _id: profile._id } : null;
  },
});

/**
 * Internal: check if quotes already generated for a user today.
 */
export const hasQuotesForToday = internalQuery({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const quotes = await ctx.db
      .query("daily_quotes")
      .withIndex("by_profile_date", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId).eq("date", args.date)
      )
      .take(2);
    return quotes.length > 0;
  },
});
