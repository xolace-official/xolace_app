import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { purgeEpisodicEntries } from "../episodicMemory";
import { pushNotifications } from "../lib/pushNotifications";
import { rankDelete } from "../lib/aggregates";

const USER_BATCH_SIZE = 10;
const BATCH_SIZE = 100;

/**
 * Sweep entry point: find accounts marked "deleted" and hand each one to
 * `purgeUser`, which drains that user's data across as many transactions as
 * it takes. This function deliberately owns no per-user deletion logic —
 * a single mutation cannot bound a user with thousands of sessions.
 *
 * Each selected user is claimed (flipped "deleted" → "purging") in the same
 * transaction that schedules its drain. The claim moves the user out of the
 * "deleted" bucket this index scans, so a later cron tick advances to the
 * next unclaimed users instead of re-selecting an in-flight one and
 * enqueuing a duplicate purgeUser chain. Convex schedules the drain
 * atomically with this commit, so a claimed user always has a worker.
 */
export const purge = internalMutation({
  args: {},
  handler: async (ctx) => {
    const deletedUsers = await ctx.db
      .query("users")
      .withIndex("by_deletion", (q) => q.eq("accountStatus", "deleted"))
      .take(USER_BATCH_SIZE);

    if (deletedUsers.length === 0) return;

    for (const user of deletedUsers) {
      await ctx.db.patch(user._id, { accountStatus: "purging" });
      await ctx.scheduler.runAfter(
        0,
        internal.jobs.accountDeletion.purgeUser,
        { userId: user._id }
      );
    }
  },
});

/**
 * Drain one deleted user's data, one bounded batch per invocation.
 *
 * The user doc is what makes this user reachable by `purge`, and the profile
 * id is what makes their sub-tables reachable at all. Both are deleted ONLY
 * once every sweep below came back under its batch size — otherwise we
 * reschedule and leave the trail intact. Deleting them early would strand
 * every remaining session (and its rawInput) in the database permanently.
 */
export const purgeUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // Proceed only while this user is pending deletion. "purging" is the
    // sweep's claim on a drain we own; "deleted" covers a drain scheduled
    // before the claim step existed. Any other status means the grace
    // period reactivated the account (users.getOrCreate flips "deleted"
    // back to "active") — stop, their remaining data stays.
    if (user.accountStatus !== "deleted" && user.accountStatus !== "purging")
      return;

    const profileId = user.emotionalProfileId;
    let hasMore = false;

    // ── Sessions + everything hanging off them ───────────────────
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (sessions.length === BATCH_SIZE) hasMore = true;

    // Wipe parity (hard invariant): episodic embeddings die in the
    // same job that deletes the session rows.
    await purgeEpisodicEntries(
      ctx,
      profileId,
      sessions.map((s) => s._id)
    );

    for (const session of sessions) {
      // The TTS render of the user's own mirror — nothing else references
      // this blob, so it leaks into storage forever if we skip it.
      if (session.mirrorAudioStorageId) {
        await ctx.storage.delete(session.mirrorAudioStorageId);
      }

      const metadata = await ctx.db
        .query("emotional_metadata")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .unique();
      if (metadata) await ctx.db.delete(metadata._id);

      let turns;
      do {
        turns = await ctx.db
          .query("session_turns")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .take(10);
        for (const turn of turns) await ctx.db.delete(turn._id);
      } while (turns.length === 10);

      await ctx.db.delete(session._id);
    }

    // ── Anonymize escalation events (preserve for safety audit) ──
    const escalations = await ctx.db
      .query("escalation_events")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
      .take(BATCH_SIZE);

    if (escalations.length === BATCH_SIZE) hasMore = true;
    for (const event of escalations) {
      await ctx.db.patch(event._id, { emotionalProfileId: undefined });
    }

    // ── Consent records ──────────────────────────────────────────
    const consentRecords = await ctx.db
      .query("consent_records")
      .withIndex("by_profile_type", (q) =>
        q.eq("emotionalProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (consentRecords.length === BATCH_SIZE) hasMore = true;
    for (const record of consentRecords) await ctx.db.delete(record._id);

    // ── Notification log ─────────────────────────────────────────
    const notifications = await ctx.db
      .query("notification_log")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
      .take(BATCH_SIZE);

    if (notifications.length === BATCH_SIZE) hasMore = true;
    for (const notif of notifications) await ctx.db.delete(notif._id);

    // ── Reflection resonances ────────────────────────────────────
    const resonances = await ctx.db
      .query("reflection_resonances")
      .withIndex("by_profile_reflection", (q) =>
        q.eq("emotionalProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (resonances.length === BATCH_SIZE) hasMore = true;
    for (const resonance of resonances) await ctx.db.delete(resonance._id);

    // ── Reports this user filed on others' reflections ───────────
    const reports = await ctx.db
      .query("reflection_reports")
      .withIndex("by_profile_reflection", (q) =>
        q.eq("reporterProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (reports.length === BATCH_SIZE) hasMore = true;
    for (const report of reports) await ctx.db.delete(report._id);

    // ── Emotional feedback (mirror_miss / gave_up / mood) ────────
    const feedbackRecords = await ctx.db
      .query("feedback")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
      .take(BATCH_SIZE);

    if (feedbackRecords.length === BATCH_SIZE) hasMore = true;
    for (const record of feedbackRecords) await ctx.db.delete(record._id);

    // ── Product feedback (free text the user wrote) ──────────────
    const productFeedback = await ctx.db
      .query("product_feedback")
      .withIndex("by_profile_and_created", (q) =>
        q.eq("emotionalProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (productFeedback.length === BATCH_SIZE) hasMore = true;
    for (const record of productFeedback) await ctx.db.delete(record._id);

    // ── Daily quotes (session-derived quotes carry their words) ──
    const quotes = await ctx.db
      .query("daily_quotes")
      .withIndex("by_profile_date", (q) =>
        q.eq("emotionalProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (quotes.length === BATCH_SIZE) hasMore = true;
    for (const quote of quotes) await ctx.db.delete(quote._id);

    // ── Insight waitlist intents ─────────────────────────────────
    const waitlistRows = await ctx.db
      .query("insight_waitlist")
      .withIndex("by_profile_feature", (q) =>
        q.eq("emotionalProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (waitlistRows.length === BATCH_SIZE) hasMore = true;
    for (const row of waitlistRows) await ctx.db.delete(row._id);

    // ── Semantic profile versions ────────────────────────────────
    const semanticVersions = await ctx.db
      .query("semantic_profiles")
      .withIndex("by_profile_version", (q) =>
        q.eq("emotionalProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (semanticVersions.length === BATCH_SIZE) hasMore = true;
    for (const version of semanticVersions) await ctx.db.delete(version._id);

    // ── More to drain? Come back before touching profile/user ────
    if (hasMore) {
      await ctx.scheduler.runAfter(
        0,
        internal.jobs.accountDeletion.purgeUser,
        { userId: args.userId }
      );
      return;
    }

    // ── Final batch: everything below happens exactly once ───────

    // Preferences (1:1 with the profile)
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
      .unique();
    if (preferences) await ctx.db.delete(preferences._id);

    // A deleted user must never receive a follow-up nudge. Scheduled because
    // it cancels component workflows and is independently bounded.
    await ctx.scheduler.runAfter(0, internal.followUps.purgeForProfile, {
      emotionalProfileId: profileId,
    });

    // Push tokens live in the component, keyed by profile id — deleting the
    // profile row does not reach them.
    await pushNotifications.removeToken(ctx, { userId: profileId });

    // Must run before the row is gone — the aggregate needs the doc to locate
    // its key. Skipping this leaves a phantom in the percentile denominator.
    await rankDelete(ctx, profileId);

    await ctx.db.delete(profileId);
    await ctx.db.delete(user._id);
  },
});
