import { purgeSessions } from "../lib/sessionCascade";
import { BATCH_SIZE, DrainStep } from "./accountDeletionFinalize";

export const drainSessions: DrainStep = async (ctx, profileId) => {
  const sessions = await ctx.db
    .query("sessions")
    .withIndex("by_profile_time", (q) => q.eq("emotionalProfileId", profileId))
    .take(BATCH_SIZE);
  await purgeSessions(ctx, profileId, sessions);
  return sessions.length === BATCH_SIZE;
};

/** Anonymize escalation events — preserved for safety audit. */
export const drainEscalations: DrainStep = async (ctx, profileId) => {
  const escalations = await ctx.db
    .query("escalation_events")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
    .take(BATCH_SIZE);
  for (const event of escalations) {
    await ctx.db.patch(event._id, { emotionalProfileId: undefined });
  }
  return escalations.length === BATCH_SIZE;
};

export const drainConsentRecords: DrainStep = async (ctx, profileId) => {
  const records = await ctx.db
    .query("consent_records")
    .withIndex("by_profile_type", (q) => q.eq("emotionalProfileId", profileId))
    .take(BATCH_SIZE);
  for (const record of records) await ctx.db.delete(record._id);
  return records.length === BATCH_SIZE;
};

export const drainNotifications: DrainStep = async (ctx, profileId) => {
  const notifications = await ctx.db
    .query("notification_log")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
    .take(BATCH_SIZE);
  for (const notif of notifications) await ctx.db.delete(notif._id);
  return notifications.length === BATCH_SIZE;
};

export const drainResonances: DrainStep = async (ctx, profileId) => {
  const resonances = await ctx.db
    .query("reflection_resonances")
    .withIndex("by_profile_reflection", (q) =>
      q.eq("emotionalProfileId", profileId)
    )
    .take(BATCH_SIZE);
  for (const resonance of resonances) await ctx.db.delete(resonance._id);
  return resonances.length === BATCH_SIZE;
};

/** Reports this user filed on others' reflections. */
export const drainReports: DrainStep = async (ctx, profileId) => {
  const reports = await ctx.db
    .query("reflection_reports")
    .withIndex("by_profile_reflection", (q) =>
      q.eq("reporterProfileId", profileId)
    )
    .take(BATCH_SIZE);
  for (const report of reports) await ctx.db.delete(report._id);
  return reports.length === BATCH_SIZE;
};

/**
 * Anonymize emotional feedback (mirror_miss / gave_up / mood). Retained for
 * product signal, stripped of both the owner link and the user's own words.
 */
export const drainFeedback: DrainStep = async (ctx, profileId) => {
  const records = await ctx.db
    .query("feedback")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
    .take(BATCH_SIZE);
  for (const record of records) {
    await ctx.db.patch(record._id, {
      emotionalProfileId: undefined,
      text: undefined,
    });
  }
  return records.length === BATCH_SIZE;
};

/**
 * Anonymize product feedback (bug / idea). `text` is deliberately RETAINED —
 * see CONTEXT.md "Feedback retention"; it must never surface user-facing.
 */
export const drainProductFeedback: DrainStep = async (ctx, profileId) => {
  const records = await ctx.db
    .query("product_feedback")
    .withIndex("by_profile_and_created", (q) =>
      q.eq("emotionalProfileId", profileId)
    )
    .take(BATCH_SIZE);
  for (const record of records) {
    await ctx.db.patch(record._id, { emotionalProfileId: undefined });
  }
  return records.length === BATCH_SIZE;
};

export const drainQuotes: DrainStep = async (ctx, profileId) => {
  const quotes = await ctx.db
    .query("daily_quotes")
    .withIndex("by_profile_date", (q) => q.eq("emotionalProfileId", profileId))
    .take(BATCH_SIZE);
  for (const quote of quotes) await ctx.db.delete(quote._id);
  return quotes.length === BATCH_SIZE;
};

export const drainWaitlist: DrainStep = async (ctx, profileId) => {
  const rows = await ctx.db
    .query("insight_waitlist")
    .withIndex("by_profile_feature", (q) =>
      q.eq("emotionalProfileId", profileId)
    )
    .take(BATCH_SIZE);
  for (const row of rows) await ctx.db.delete(row._id);
  return rows.length === BATCH_SIZE;
};

