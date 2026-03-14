import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

const BATCH_SIZE = 10;

/**
 * Purge data for accounts with status "deleted".
 * - Delete: profile, preferences, sessions, metadata, turns, consent, notifications
 * - Anonymize: escalation_events (strip emotionalProfileId)
 * - Delete: user doc
 * Processes in batches and self-reschedules if more remain.
 */
export const purge = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find users pending deletion
    const deletedUsers = await ctx.db
      .query("users")
      .withIndex("by_deletion", (q) => q.eq("accountStatus", "deleted"))
      .take(BATCH_SIZE);

    if (deletedUsers.length === 0) return;

    for (const user of deletedUsers) {
      const profileId = user.emotionalProfileId;

      // Delete sessions + associated data
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_profile_time", (q) =>
          q.eq("emotionalProfileId", profileId)
        )
        .take(100);

      for (const session of sessions) {
        // Delete metadata
        const metadata = await ctx.db
          .query("emotional_metadata")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .unique();
        if (metadata) await ctx.db.delete(metadata._id);

        // Delete turns
        const turns = await ctx.db
          .query("session_turns")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .take(10);
        for (const turn of turns) await ctx.db.delete(turn._id);

        await ctx.db.delete(session._id);
      }

      // Anonymize escalation events (strip profileId, preserve for safety audit)
      const escalations = await ctx.db
        .query("escalation_events")
        .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
        .take(100);

      for (const event of escalations) {
        await ctx.db.patch(event._id, {
          emotionalProfileId: undefined,
        });
      }

      // Delete consent records
      const consentRecords = await ctx.db
        .query("consent_records")
        .withIndex("by_profile_type", (q) =>
          q.eq("emotionalProfileId", profileId)
        )
        .take(100);
      for (const record of consentRecords) await ctx.db.delete(record._id);

      // Delete notifications
      const notifications = await ctx.db
        .query("notification_log")
        .withIndex("by_profile", (q) =>
          q.eq("emotionalProfileId", profileId)
        )
        .take(100);
      for (const notif of notifications) await ctx.db.delete(notif._id);

      // Delete preferences
      const preferences = await ctx.db
        .query("preferences")
        .withIndex("by_profile", (q) =>
          q.eq("emotionalProfileId", profileId)
        )
        .unique();
      if (preferences) await ctx.db.delete(preferences._id);

      // Delete emotional profile
      await ctx.db.delete(profileId);

      // Delete user
      await ctx.db.delete(user._id);
    }

    // Self-reschedule if we hit the batch limit
    if (deletedUsers.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.jobs.accountDeletion.purge, {});
    }
  },
});
