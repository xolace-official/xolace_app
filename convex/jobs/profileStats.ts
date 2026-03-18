import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

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

    // Update streak (reset if last session was > 48h ago)
    const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;
    let newStreak = profile.currentStreak;
    if (profile.lastSessionAt && now - profile.lastSessionAt > STREAK_WINDOW_MS) {
      newStreak = 1; // Reset
    } else {
      newStreak = profile.currentStreak + 1;
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
  },
});
