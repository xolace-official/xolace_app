import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Update emotional profile stats after a session completes.
 * Updates sessionCount, streak, dominantEmotionTags, averageSessionDuration.
 */
export const updateAfterSession = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.emotionalProfileId);
    if (!profile) return;

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.state !== "completed") return;

    const now = Date.now();
    const newSessionCount = profile.sessionCount + 1;

    // Update average duration
    let newAvgDuration = profile.averageSessionDuration;
    if (session.sessionDuration) {
      if (profile.averageSessionDuration) {
        // Incremental average
        newAvgDuration =
          profile.averageSessionDuration +
          (session.sessionDuration - profile.averageSessionDuration) /
            newSessionCount;
      } else {
        newAvgDuration = session.sessionDuration;
      }
    }

    // Update streak: +1 per calendar day, reset after 48h gap
    const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;
    let newStreak = profile.currentStreak;
    if (!profile.lastSessionAt) {
      // First ever session
      newStreak = 1;
    } else if (now - profile.lastSessionAt > STREAK_WINDOW_MS) {
      // Been away too long — reset
      newStreak = 1;
    } else {
      // Only increment if last session was on a different calendar day (UTC)
      const lastDate = new Date(profile.lastSessionAt);
      const nowDate = new Date(now);
      const sameDay =
        lastDate.getUTCFullYear() === nowDate.getUTCFullYear() &&
        lastDate.getUTCMonth() === nowDate.getUTCMonth() &&
        lastDate.getUTCDate() === nowDate.getUTCDate();
      if (!sameDay) {
        newStreak = profile.currentStreak + 1;
      }
      // else: same day, streak stays the same
    }

    // Update dominant emotion tags from recent metadata
    const recentMetadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_emotion", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId)
      )
      .order("desc")
      .take(20);

    const emotionCounts: Record<string, number> = {};
    for (const m of recentMetadata) {
      emotionCounts[m.primaryEmotion] =
        (emotionCounts[m.primaryEmotion] ?? 0) + 1;
    }
    const dominantEmotionTags = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);

    // Compute typicalUsagePattern after 5+ sessions
    let typicalUsagePattern = profile.typicalUsagePattern;
    if (newSessionCount >= 5) {
      const allRecent = await ctx.db
        .query("sessions")
        .withIndex("by_profile_time", (q) =>
          q.eq("emotionalProfileId", args.emotionalProfileId)
        )
        .order("desc")
        .take(40);
      const completedRecent = allRecent
        .filter((s) => s.state === "completed")
        .slice(0, 20);

      const timeOfDayToHour: Record<string, number> = {
        early_morning: 6,
        morning: 10,
        afternoon: 14,
        evening: 19,
        late_night: 23,
      };

      const dayCounts: Record<number, number> = {};
      const hourCounts: Record<number, number> = {};
      for (const s of completedRecent) {
        if (s.dayOfWeek !== undefined) {
          dayCounts[s.dayOfWeek] = (dayCounts[s.dayOfWeek] ?? 0) + 1;
        }
        if (s.timeOfDay) {
          const hour = timeOfDayToHour[s.timeOfDay];
          if (hour !== undefined) {
            hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
          }
        }
      }

      const modeDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0];
      const modeHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
      if (modeDay && modeHour) {
        typicalUsagePattern = {
          dayOfWeek: Number(modeDay[0]),
          hourOfDay: Number(modeHour[0]),
        };
      }
    }

    await ctx.db.patch(args.emotionalProfileId, {
      sessionCount: newSessionCount,
      currentStreak: newStreak,
      dominantEmotionTags:
        dominantEmotionTags.length > 0
          ? dominantEmotionTags
          : profile.dominantEmotionTags,
      averageSessionDuration: newAvgDuration,
      typicalUsagePattern,
      lastSessionAt: now,
      firstSessionAt: profile.firstSessionAt ?? now,
      updatedAt: now,
    });

    // Mark any unresolved notification_log entries within the last 24h as
    // having resulted in a session — covers organic returns (no tap required).
    const ATTRIBUTION_WINDOW_MS = 24 * 60 * 60 * 1000;
    const attributionCutoff = now - ATTRIBUTION_WINDOW_MS;
    const [attributedLog] = await ctx.db
      .query("notification_log")
      .withIndex("by_profile", (q) =>
        q
          .eq("emotionalProfileId", args.emotionalProfileId)
          .gte("sentAt", attributionCutoff)
      )
      .order("desc")
      .take(1);

    if (attributedLog && attributedLog.resultedInSession === undefined) {
      await ctx.db.patch(attributedLog._id, { resultedInSession: true });
    }

    // Check for milestone notification
    const milestoneMessages: Record<number, string> = {
      1: "You showed up. That's the hardest part.",
      7: "A week of showing up for yourself. That takes something real.",
      30: "30 sessions. You've built a practice of listening to yourself.",
      100: "100 sessions. What started as a moment has become a practice.",
    };

    const milestoneMessage = milestoneMessages[newSessionCount];
    if (milestoneMessage) {
      // Check if milestone notifications are enabled
      const preferences = await ctx.db
        .query("preferences")
        .withIndex("by_profile", (q) =>
          q.eq("emotionalProfileId", args.emotionalProfileId)
        )
        .unique();

      if (
        preferences?.notifications.enabled &&
        preferences.notifications.milestone
      ) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.schedule,
          {
            emotionalProfileId: args.emotionalProfileId,
            type: "milestone",
            content: milestoneMessage,
            triggerReason: `Session count reached ${newSessionCount}`,
            scheduledFor: now,
          }
        );
      }
    }
  },
});
