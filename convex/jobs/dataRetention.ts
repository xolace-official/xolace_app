import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

const TIERS = ["6_months", "1_year"] as const;
type Tier = (typeof TIERS)[number];

const RETENTION_MS: Record<Tier, number> = {
  "6_months": 6 * 30 * 24 * 60 * 60 * 1000,
  "1_year": 365 * 24 * 60 * 60 * 1000,
};

const tierValidator = v.union(v.literal("6_months"), v.literal("1_year"));

const BATCH_SIZE = 50;
const PREFS_PAGE_SIZE = 100;
const TURNS_PER_SESSION_BATCH = 100;

function nextTier(tier: Tier): Tier | null {
  const idx = TIERS.indexOf(tier);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

/**
 * Purge session data older than the user's retention preference.
 * Processes one retention tier per invocation (Convex allows only one
 * paginated query per mutation) and self-reschedules to continue.
 */
export const enforce = internalMutation({
  args: {
    tier: v.optional(tierValidator),
    cursor: v.optional(v.union(v.string(), v.null())),
    sessionWorkPending: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tier: Tier = args.tier ?? TIERS[0];
    const cursor = args.cursor ?? null;
    const priorPending = args.sessionWorkPending ?? false;

    const { page: prefs, isDone, continueCursor } = await ctx.db
      .query("preferences")
      .withIndex("by_retention", (q) => q.eq("dataRetentionPreference", tier))
      .paginate({ numItems: PREFS_PAGE_SIZE, cursor });

    const cutoff = Date.now() - RETENTION_MS[tier];
    let moreSessionWork = priorPending;

    for (const pref of prefs) {
      const oldSessions = await ctx.db
        .query("sessions")
        .withIndex("by_profile_time", (q) =>
          q
            .eq("emotionalProfileId", pref.emotionalProfileId)
            .lt("createdAt", cutoff)
        )
        .take(BATCH_SIZE);

      if (oldSessions.length === BATCH_SIZE) {
        moreSessionWork = true;
      }

      for (const session of oldSessions) {
        const metadata = await ctx.db
          .query("emotional_metadata")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .unique();
        if (metadata) {
          await ctx.db.delete(metadata._id);
        }

        const turns = await ctx.db
          .query("session_turns")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .take(TURNS_PER_SESSION_BATCH);
        for (const turn of turns) {
          await ctx.db.delete(turn._id);
        }

        if (turns.length === TURNS_PER_SESSION_BATCH) {
          // More turns remain for this session — leave the session row so the
          // next scan revisits it and finishes the turn cleanup first.
          moreSessionWork = true;
          continue;
        }

        await ctx.db.delete(session._id);
      }

      // Delete feedback records for this profile older than the retention cutoff
      const feedbackRecords = await ctx.db
        .query("feedback")
        .withIndex("by_profile_and_created", (q) =>
          q.eq("emotionalProfileId", pref.emotionalProfileId).lt("createdAt", cutoff)
        )
        .take(BATCH_SIZE);
      for (const record of feedbackRecords) {
        await ctx.db.delete(record._id);
      }
    }

    if (!isDone) {
      await ctx.scheduler.runAfter(0, internal.jobs.dataRetention.enforce, {
        tier,
        cursor: continueCursor,
        sessionWorkPending: moreSessionWork,
      });
      return;
    }

    if (moreSessionWork) {
      // Restart this tier's pref scan on the next run so stalled deletions resume.
      await ctx.scheduler.runAfter(0, internal.jobs.dataRetention.enforce, {
        tier,
        cursor: null,
      });
      return;
    }

    const next = nextTier(tier);
    if (next) {
      await ctx.scheduler.runAfter(0, internal.jobs.dataRetention.enforce, {
        tier: next,
        cursor: null,
      });
    }
  },
});
