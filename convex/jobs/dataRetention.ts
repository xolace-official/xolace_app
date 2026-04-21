import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

const RETENTION_MS = {
  "6_months": 6 * 30 * 24 * 60 * 60 * 1000,
  "1_year": 365 * 24 * 60 * 60 * 1000,
} as const;

const BATCH_SIZE = 50;
const PREFS_PAGE_SIZE = 100;

/**
 * Purge session data older than the user's retention preference.
 * Processes in batches and self-reschedules if more work remains.
 */
export const enforce = internalMutation({
  args: {
    cursors: v.optional(
      v.object({
        "6_months": v.optional(v.union(v.string(), v.null())),
        "1_year": v.optional(v.union(v.string(), v.null())),
      })
    ),
  },
  handler: async (ctx, args) => {
    let moreWork = false;
    const nextCursors: Record<string, string | null> = {};

    for (const tier of Object.keys(RETENTION_MS) as (keyof typeof RETENTION_MS)[]) {
      const cursor = args.cursors?.[tier] ?? null;

      const { page: prefs, isDone, continueCursor } = await ctx.db
        .query("preferences")
        .withIndex("by_retention", (q) => q.eq("dataRetentionPreference", tier))
        .paginate({ numItems: PREFS_PAGE_SIZE, cursor });

      if (!isDone) {
        moreWork = true;
        nextCursors[tier] = continueCursor;
      }

      const retentionMs = RETENTION_MS[tier];
      const cutoff = Date.now() - retentionMs;

      for (const pref of prefs) {
        // Find old sessions for this profile
        const oldSessions = await ctx.db
          .query("sessions")
          .withIndex("by_profile_time", (q) =>
            q
              .eq("emotionalProfileId", pref.emotionalProfileId)
              .lt("createdAt", cutoff)
          )
          .take(BATCH_SIZE);

        if (oldSessions.length === BATCH_SIZE) {
          moreWork = true;
        }

        for (const session of oldSessions) {
          // Delete associated metadata
          const metadata = await ctx.db
            .query("emotional_metadata")
            .withIndex("by_session", (q) => q.eq("sessionId", session._id))
            .unique();
          if (metadata) {
            await ctx.db.delete(metadata._id);
          }

          // Delete associated turns
          const turns = await ctx.db
            .query("session_turns")
            .withIndex("by_session", (q) => q.eq("sessionId", session._id))
            .take(10);
          for (const turn of turns) {
            await ctx.db.delete(turn._id);
          }

          // Delete the session
          await ctx.db.delete(session._id);
        }
      }
    }

    // Self-reschedule if more work remains, forwarding cursors for any
    // unfinished preference pages so we continue where we left off.
    if (moreWork) {
      await ctx.scheduler.runAfter(0, internal.jobs.dataRetention.enforce, {
        cursors: nextCursors,
      });
    }
  },
});
