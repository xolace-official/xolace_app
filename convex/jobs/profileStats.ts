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

    await ctx.db.patch(args.emotionalProfileId, {
      sessionCount: newSessionCount,
      currentStreak: newStreak,
      dominantEmotionTags:
        dominantEmotionTags.length > 0
          ? dominantEmotionTags
          : profile.dominantEmotionTags,
      averageSessionDuration: newAvgDuration,
      lastSessionAt: now,
      firstSessionAt: profile.firstSessionAt ?? now,
      updatedAt: now,
    });
  },
});
