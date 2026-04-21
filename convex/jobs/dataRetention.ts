import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

const RETENTION_MS = {
  "6_months": 6 * 30 * 24 * 60 * 60 * 1000,
  "1_year": 365 * 24 * 60 * 60 * 1000,
} as const;

const BATCH_SIZE = 50;

/**
 * Purge session data older than the user's retention preference.
 * Processes in batches and self-reschedules if more work remains.
 */
export const enforce = internalMutation({
  args: {},
  handler: async (ctx) => {
    let moreWork = false;

    // Query each non-indefinite retention tier separately to avoid a full table scan.
    const tieredPreferences = (
      await Promise.all(
        (Object.keys(RETENTION_MS) as (keyof typeof RETENTION_MS)[]).map((tier) =>
          ctx.db
            .query("preferences")
            .withIndex("by_retention", (q) => q.eq("dataRetentionPreference", tier))
            .take(100)
        )
      )
    ).flat();

    for (const pref of tieredPreferences) {
      const retentionMs =
        RETENTION_MS[pref.dataRetentionPreference as keyof typeof RETENTION_MS];
      if (!retentionMs) continue;

      const cutoff = Date.now() - retentionMs;

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

    // Self-reschedule if more work remains
    if (moreWork) {
      await ctx.scheduler.runAfter(0, internal.jobs.dataRetention.enforce, {});
    }
  },
});
