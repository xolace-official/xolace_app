import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/**
 * Build the full context needed for AI processing of a session.
 * Loads session, turns, profile patterns, and preferences.
 */
export const buildSessionContext = internalQuery({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Load profile
    const profile = await ctx.db.get(session.emotionalProfileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Load preferences (for mirrorTone)
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    // Load session turns (refinement history)
    const turns = await ctx.db
      .query("session_turns")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .take(5);

    // Load recent sessions for pattern context (last 10)
    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .order("desc")
      .take(10);

    // Load recent emotional metadata
    const recentMetadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_emotion", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .order("desc")
      .take(10);

    return {
      session,
      profile: {
        sessionCount: profile.sessionCount,
        currentStreak: profile.currentStreak,
        dominantEmotionTags: profile.dominantEmotionTags,
        averageSessionDuration: profile.averageSessionDuration,
        onboardingComplete: profile.onboardingComplete,
      },
      preferences: preferences
        ? {
            mirrorTone: preferences.mirrorTone,
            reducedMotion: preferences.reducedMotion,
          }
        : null,
      turns,
      recentSessions: recentSessions
        .filter((s) => s._id !== args.sessionId)
        .slice(0, 5)
        .map((s) => ({
          state: s.state,
          entryType: s.entryType,
          timeOfDay: s.timeOfDay,
          pathChosen: s.pathChosen,
          createdAt: s.createdAt,
        })),
      recentMetadata: recentMetadata.slice(0, 5).map((m) => ({
        primaryEmotion: m.primaryEmotion,
        granularLabel: m.granularLabel,
        intensity: m.intensity,
        thematicTags: m.thematicTags,
        userLanguageTags: m.userLanguageTags,
        temporalContext: m.temporalContext,
      })),
    };
  },
});
