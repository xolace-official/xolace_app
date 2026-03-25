import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/** Canonical return type of buildSessionContext. */
export interface SessionContext {
  session: Record<string, unknown>;
  isFirstSession: boolean;
  profile: {
    sessionCount: number;
    currentStreak: number;
    dominantEmotionTags: string[];
    averageSessionDuration?: number;
    onboardingComplete: boolean;
  };
  preferences: {
    mirrorTone: string;
    reducedMotion: boolean;
  } | null;
  turns: Record<string, unknown>[];
  recentSessions: {
    state: string;
    entryType: string;
    timeOfDay?: string;
    pathChosen?: string;
    mirrorText?: string;
    createdAt: number;
  }[];
  recentMetadata: {
    primaryEmotion: string;
    granularLabel?: string;
    intensity: number;
    thematicTags: string[];
    userLanguageTags: string[];
    temporalContext?: string;
    riskFlag: boolean;
    createdAt: number;
  }[];
}

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

    // Load recent emotional metadata (ordered by _creationTime desc)
    // Using by_profile_theme index [emotionalProfileId] so .order("desc")
    // sorts by _creationTime, not by primaryEmotion.
    const recentMetadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_theme", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .order("desc")
      .take(10);

    return {
      session,
      isFirstSession: profile.sessionCount === 0,
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
          mirrorText: s.mirrorText,
          createdAt: s.createdAt,
        })),
      recentMetadata: recentMetadata.slice(0, 5).map((m) => ({
        primaryEmotion: m.primaryEmotion,
        granularLabel: m.granularLabel,
        intensity: m.intensity,
        thematicTags: m.thematicTags,
        userLanguageTags: m.userLanguageTags,
        temporalContext: m.temporalContext,
        riskFlag: m.riskFlag,
        createdAt: m.createdAt,
      })),
    };
  },
});
