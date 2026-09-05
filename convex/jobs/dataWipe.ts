import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { purgeSessions } from "../lib/sessionCascade";
import { purgeReplyEntries } from "../episodicMemory";
import { rankReplace } from "../lib/aggregates";

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

    await purgeSessions(ctx, emotionalProfileId, sessions);

    // ── Delete reflection resonances ─────────────────────────────
    const resonances = await ctx.db
      .query("reflection_resonances")
      .withIndex("by_profile_reflection", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);

    if (resonances.length === BATCH_SIZE) hasMore = true;
    for (const r of resonances) await ctx.db.delete("reflection_resonances", r._id);

    // ── Delete notification log ──────────────────────────────────
    const notifications = await ctx.db
      .query("notification_log")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);

    if (notifications.length === BATCH_SIZE) hasMore = true;
    for (const n of notifications) await ctx.db.delete("notification_log", n._id);

    // ── Delete daily quotes ──────────────────────────────────────
    // Session-derived quotes are distilled from the words being wiped.
    const quotes = await ctx.db
      .query("daily_quotes")
      .withIndex("by_profile_date", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);

    if (quotes.length === BATCH_SIZE) hasMore = true;
    // A reply's embedding must not outlive the row it came from — this loop
    // touches no vector on its own (ADR 0007). Only replied rows have a key:
    // most of a batch is untouched quotes, and a cleared reply already purged.
    await purgeReplyEntries(
      ctx,
      emotionalProfileId,
      quotes.filter((q) => q.reply !== undefined).map((q) => q._id),
    );
    for (const q of quotes) await ctx.db.delete("daily_quotes", q._id);

    // ── Anonymize escalation events ──────────────────────────────
    const escalations = await ctx.db
      .query("escalation_events")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);

    if (escalations.length === BATCH_SIZE) hasMore = true;
    for (const e of escalations) {
      await ctx.db.patch("escalation_events", e._id, { emotionalProfileId: undefined });
    }

    // ── Cancel + purge follow-up cards (and their live workflows) ─
    // Only on the final batch, since the dedicated purge is itself bounded.
    if (!hasMore) {
      await ctx.scheduler.runAfter(0, internal.followUps.purgeForProfile, {
        emotionalProfileId,
      });
    }

    // ── Delete semantic profile versions (all of them) ───────────
    // The AI's narrative understanding is memory; a wipe erases it.
    const semanticVersions = await ctx.db
      .query("semantic_profiles")
      .withIndex("by_profile_version", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .take(BATCH_SIZE);
    if (semanticVersions.length === BATCH_SIZE) hasMore = true;
    for (const version of semanticVersions) await ctx.db.delete("semantic_profiles", version._id);

    // ── Delete the intake row ────────────────────────────────────
    // Answers about how someone copes and what they're carrying cannot
    // survive "wipe my data". `onboardingComplete` stays true on the
    // surviving profile on purpose — the flag and the answers have
    // different lifetimes (CONTEXT.md, "Intake, and the two onboardings").
    const intake = await ctx.db
      .query("intake_responses")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId)
      )
      .unique();
    if (intake) await ctx.db.delete("intake_responses", intake._id);

    // ── Reset emotional profile counters ─────────────────────────
    // Only reset on the final batch (no more sessions to delete)
    if (!hasMore) {
      // Read before the patch — the percentile aggregate needs the old
      // sessionCount to find and move this profile's key.
      const profileBeforeReset = await ctx.db.get("emotional_profiles", emotionalProfileId);
      await ctx.db.patch("emotional_profiles", emotionalProfileId, {
        sessionCount: 0,
        // every daily_quotes row for this profile was deleted above, saved ones included
        savedQuoteCount: 0,
        currentStreak: 0,
        dominantEmotionTags: [],
        firstSessionAt: undefined,
        lastSessionAt: undefined,
        averageSessionDuration: undefined,
        typicalUsagePattern: undefined,
        dataWipeInProgress: undefined,
        currentSemanticProfileId: undefined,
        lastConsolidationAt: undefined,
        updatedAt: Date.now(),
      });
      if (profileBeforeReset) await rankReplace(ctx, profileBeforeReset);
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
