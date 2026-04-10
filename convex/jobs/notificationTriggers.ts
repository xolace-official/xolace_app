import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

const GENTLE_RETURN_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours
const INACTIVE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Scan profiles and send gentle_return notifications to users
 * who haven't had a session in 48+ hours but are still active
 * (last session within 30 days).
 *
 * Runs on a cron schedule. Processes in batches to stay within
 * transaction limits.
 */
export const checkGentleReturn = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const gentleReturnCutoff = now - GENTLE_RETURN_WINDOW_MS;
    const inactiveCutoff = now - INACTIVE_THRESHOLD_MS;

    // Get profiles that have a lastSessionAt (have completed at least one session)
    // We scan emotional_profiles and filter in-memory since there's no index
    // on lastSessionAt. At MVP scale (<10k profiles) this is fine.
    const profiles = await ctx.db.query("emotional_profiles").take(500);

    for (const profile of profiles) {
      // Skip profiles that have never completed a session
      if (!profile.lastSessionAt) continue;

      // Skip if session was recent (within 48h)
      if (profile.lastSessionAt > gentleReturnCutoff) continue;

      // Skip if user has been inactive too long (>30 days) — don't pester
      if (profile.lastSessionAt < inactiveCutoff) continue;

      // Check if this profile has notifications enabled
      const preferences = await ctx.db
        .query("preferences")
        .withIndex("by_profile", (q) =>
          q.eq("emotionalProfileId", profile._id)
        )
        .unique();

      if (!preferences) continue;
      if (!preferences.notifications.enabled) continue;
      if (!preferences.notifications.gentleReturn) continue;

      // Schedule the notification — rate limiter inside schedule()
      // will prevent duplicates within 24h
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.schedule,
        {
          emotionalProfileId: profile._id,
          type: "gentle_return",
          content: "It's been a little while. There's no rush but if something's sitting with you, this is a safe place to let it out.",
          triggerReason: `No session in ${Math.round((now - profile.lastSessionAt) / (60 * 60 * 1000))}h`,
          scheduledFor: now,
        }
      );
    }
  },
});

/**
 * Send pattern_nudge notifications to users at their typical usage time.
 * Matches profiles whose typicalUsagePattern aligns with the current
 * day/hour (UTC).
 *
 * Runs hourly on a cron schedule.
 */
export const checkPatternNudge = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentDate = new Date(now);
    const currentDay = currentDate.getUTCDay(); // 0-6
    const currentHour = currentDate.getUTCHours(); // 0-23

    const profiles = await ctx.db.query("emotional_profiles").take(500);

    for (const profile of profiles) {
      // Need at least 5 sessions for a usage pattern
      if (!profile.typicalUsagePattern) continue;

      // Check if current time matches their pattern
      if (profile.typicalUsagePattern.dayOfWeek !== currentDay) continue;
      if (profile.typicalUsagePattern.hourOfDay !== currentHour) continue;

      // Skip if they already had a session today
      if (
        profile.lastSessionAt &&
        now - profile.lastSessionAt < 12 * 60 * 60 * 1000
      ) {
        continue;
      }

      // Check notification preferences
      const preferences = await ctx.db
        .query("preferences")
        .withIndex("by_profile", (q) =>
          q.eq("emotionalProfileId", profile._id)
        )
        .unique();

      if (!preferences) continue;
      if (!preferences.notifications.enabled) continue;
      if (!preferences.notifications.patternNudge) continue;

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      await ctx.scheduler.runAfter(
        0,
        internal.notifications.schedule,
        {
          emotionalProfileId: profile._id,
          type: "pattern_nudge",
          content: `${dayNames[currentDay]} evening, you usually check in around now. How are you?`,
          triggerReason: `Pattern match: day=${currentDay} hour=${currentHour}`,
          scheduledFor: now,
        }
      );
    }
  },
});
