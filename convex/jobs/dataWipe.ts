import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

const BATCH_SIZE = 100;

/**
 * Wipe user content data while preserving the account, profile shell,
 * preferences, and consent records.
 *
 * Deletes: sessions, emotional_metadata, session_turns,
 *          reflection_resonances, notification_log
 * Anonymizes: escalation_events (strip profileId for safety audit)
 * Resets: emotional_profile counters
 *
 * Processes in batches and self-reschedules if more remain.
 */
export const wipe = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
  },
  handler: async (ctx, args) => {
    const { emotionalProfileId } = args;
    let hasMore = false;

    // ── Delete sessions + associated data ────────────────────────
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);

    if (sessions.length === BATCH_SIZE) hasMore = true;

    for (const session of sessions) {
      // Delete metadata (1:1)
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

    // ── Delete reflection resonances ─────────────────────────────
    const resonances = await ctx.db
      .query("reflection_resonances")
      .withIndex("by_profile_reflection", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);

    if (resonances.length === BATCH_SIZE) hasMore = true;
    for (const r of resonances) await ctx.db.delete(r._id);

    // ── Delete notification log ──────────────────────────────────
    const notifications = await ctx.db
      .query("notification_log")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);

    if (notifications.length === BATCH_SIZE) hasMore = true;
    for (const n of notifications) await ctx.db.delete(n._id);

    // ── Anonymize escalation events ──────────────────────────────
    const escalations = await ctx.db
      .query("escalation_events")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);

    if (escalations.length === BATCH_SIZE) hasMore = true;
    for (const e of escalations) {
      await ctx.db.patch(e._id, { emotionalProfileId: undefined });
    }

    // ── Reset emotional profile counters ─────────────────────────
    // Only reset on the final batch (no more sessions to delete)
    if (!hasMore) {
      await ctx.db.patch(emotionalProfileId, {
        sessionCount: 0,
        currentStreak: 0,
        dominantEmotionTags: [],
        firstSessionAt: undefined,
        lastSessionAt: undefined,
        averageSessionDuration: undefined,
        typicalUsagePattern: undefined,
        updatedAt: Date.now(),
      });
    }

    // ── Self-reschedule if more data remains ─────────────────────
    if (hasMore) {
      await ctx.scheduler.runAfter(
        0,
        internal.jobs.dataWipe.wipe,
        { emotionalProfileId }
      );
    }
  },
});
