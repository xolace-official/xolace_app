import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { renderSemanticProfile } from "../semanticProfiles";
import { hasPremium } from "../lib/premium";

/** Canonical return type of buildSessionContext. */
export interface SessionContext {
  session: Record<string, unknown>;
  /** Same-day reach guard: another session by this profile reached today. */
  profileReachedToday: boolean;
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
    spaceName?: string;
    voice?: string;
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
  // Semantic memory (Cognition Layer §1.3): the current AI-written
  // narrative profile, rendered whole — it is never vector-searched.
  // Null until the Reflection Agent writes the first version.
  semanticProfile: string | null;
  semanticProfileVersion: number | null;
  // Xolace+ entitlement — the real fence for tone-gated behavior (mirrorTone
  // preference alone isn't trustworthy after a downgrade).
  isPremium: boolean;
}

/**
 * "YYYY-MM-DD" in the user's own timezone, so "same calendar day" means their
 * day and not UTC's — at UTC+8 a UTC boundary would reset the reach guard at
 * 08:00 local, which is exactly the twice-before-dinner case it exists to stop.
 * Falls back to UTC when no timezone was captured (it is only stored once
 * notifications are configured) or the stored string is unusable.
 */
function localDay(ms: number, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(
      "en-CA",
      timeZone ? { timeZone } : {},
    ).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
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

    // Load the current semantic profile version (read whole — the
    // profile carries the longitudinal weight; recent rows below stay
    // as a recency signal).
    const semanticProfileDoc = profile.currentSemanticProfileId
      ? await ctx.db.get(profile.currentSemanticProfileId)
      : null;

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

    // Same-day reach guard (docs/confidence-aware-mirroring.md §3.7): never
    // reach twice in one calendar day per profile. No new state — one indexed
    // read of the session-scoped gapNamed boolean, newest first. Two rows
    // because the newest may be this session's own reach, which must not
    // suppress its own later turns (those resolve to holding, not plain).
    const reachedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_gapNamed", (q) =>
        q.eq("emotionalProfileId", profile._id).eq("gapNamed", true),
      )
      .order("desc")
      .take(2);
    const today = localDay(Date.now(), preferences?.notifications.timezone);

    return {
      session,
      profileReachedToday: reachedSessions.some(
        (s) =>
          s._id !== args.sessionId &&
          localDay(s.createdAt, preferences?.notifications.timezone) === today,
      ),
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
            spaceName: preferences.spaceName,
            voice: preferences.voice,
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
      semanticProfile: semanticProfileDoc
        ? renderSemanticProfile(semanticProfileDoc)
        : null,
      semanticProfileVersion: semanticProfileDoc?.version ?? null,
      isPremium: await hasPremium(ctx, profile),
    };
  },
});
