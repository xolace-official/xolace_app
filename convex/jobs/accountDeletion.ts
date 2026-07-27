import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { purgeSessions } from "../lib/sessionCascade";
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
  returns: v.null(),
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
  returns: v.null(),
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

    await purgeSessions(ctx, profileId, sessions);

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

    // ── Anonymize emotional feedback (mirror_miss / gave_up / mood) ──
    // Retained for product signal, stripped of both the owner link and the
    // user's own words. What survives is structural only: type,
    // selectedOption, turnIndex, createdAt. Clearing emotionalProfileId also
    // drops the row out of the by_profile range this query scans, so the
    // batch loop still makes progress (same mechanism as escalation_events).
    const feedbackRecords = await ctx.db
      .query("feedback")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
      .take(BATCH_SIZE);

    if (feedbackRecords.length === BATCH_SIZE) hasMore = true;
    for (const record of feedbackRecords) {
      await ctx.db.patch(record._id, {
        emotionalProfileId: undefined,
        text: undefined,
      });
    }

    // ── Anonymize product feedback (bug / idea) ──────────────────
    // Deliberate exception: `text` is RETAINED, because the prose is the
    // entire value of the row — strip it and only a kind+appVersion husk is
    // left. Recorded decision, see CONTEXT.md "Feedback retention". The
    // tradeoff is that a bug report naming a person or place outlives the
    // account, so this text must never surface anywhere user-facing.
    const productFeedback = await ctx.db
      .query("product_feedback")
      .withIndex("by_profile_and_created", (q) =>
        q.eq("emotionalProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (productFeedback.length === BATCH_SIZE) hasMore = true;
    for (const record of productFeedback) {
      await ctx.db.patch(record._id, { emotionalProfileId: undefined });
    }

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

    // ── Listener conversations (both sides of every pair) ────────
    // Rows where this user was the requester, and rows where they were
    // the listener. Stream-side message content is removed by the
    // purgeStreamUser action scheduled in the final batch.
    const conversationsAsUser = await ctx.db
      .query("listener_conversations")
      .withIndex("by_user", (q) => q.eq("userProfileId", profileId))
      .take(BATCH_SIZE);

    if (conversationsAsUser.length === BATCH_SIZE) hasMore = true;
    for (const conversation of conversationsAsUser) {
      await ctx.db.delete(conversation._id);
    }

    const conversationsAsListener = await ctx.db
      .query("listener_conversations")
      .withIndex("by_listener_and_status", (q) =>
        q.eq("listenerProfileId", profileId)
      )
      .take(BATCH_SIZE);

    if (conversationsAsListener.length === BATCH_SIZE) hasMore = true;
    for (const conversation of conversationsAsListener) {
      await ctx.db.delete(conversation._id);
    }

    // ── Conversation ratings this user gave ──────────────────────
    // The listener's denormalized counters have to come down with the
    // row, or a deleted account keeps voting. Ratings this user
    // *received* as a listener die with their listener_profiles row.
    const ratingsGiven = await ctx.db
      .query("conversation_ratings")
      .withIndex("by_rater", (q) => q.eq("raterProfileId", profileId))
      .take(BATCH_SIZE);

    if (ratingsGiven.length === BATCH_SIZE) hasMore = true;
    for (const rating of ratingsGiven) {
      const rated = await ctx.db
        .query("listener_profiles")
        .withIndex("by_profile", (q) =>
          q.eq("emotionalProfileId", rating.listenerProfileId)
        )
        .unique();
      if (rated) {
        await ctx.db.patch(rated._id, {
          ratingSum: Math.max(0, (rated.ratingSum ?? 0) - rating.rating),
          ratingCount: Math.max(0, (rated.ratingCount ?? 0) - 1),
          updatedAt: Date.now(),
        });
      }
      await ctx.db.delete(rating._id);
    }

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

    // Listener profile (1:1 with the profile, if this user was a listener)
    const listenerProfile = await ctx.db
      .query("listener_profiles")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
      .unique();
    if (listenerProfile) await ctx.db.delete(listenerProfile._id);

    // Stream-hosted chat content is external — the row deletes above don't
    // reach it. Fail-open action: logs and continues on Stream outage so a
    // third party can never block a deletion request.
    await ctx.scheduler.runAfter(0, internal.listenerChat.purgeStreamUser, {
      profileId: profileId,
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
