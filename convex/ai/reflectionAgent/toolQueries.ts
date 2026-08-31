import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { renderSemanticProfile } from "../../semanticProfiles";

// =============================================================
// Reflection Agent — READ TOOL backing queries (Cognition Layer Phase 3).
//
// Bounded internalQueries the consolidation loop reaches through
// `dispatchTool`. All are read-only and `.take(n)`-capped per the query
// guidelines — the agent never scans a table unbounded. Returns are plain
// serializable shapes; the dispatcher JSON-stringifies them into tool_result.
// =============================================================

const TIMELINE_LIMIT = 40;
const SESSIONS_LIMIT = 20;
const MOOD_LIMIT = 30;
const STATS_LIMIT = 40;

/** Emotion + intensity over time — the raw material for pattern detection. */
export const getEmotionTimeline = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_theme", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId),
      )
      .order("desc")
      .take(TIMELINE_LIMIT);
    return rows.map((m) => ({
      primaryEmotion: m.primaryEmotion,
      granularLabel: m.granularLabel ?? null,
      intensity: m.intensity,
      thematicTags: m.thematicTags,
      userLanguageTags: m.userLanguageTags,
      temporalContext: m.temporalContext ?? null,
      createdAt: m.createdAt,
    }));
  },
});

/** Recent sessions — shape, path, and how the mirror landed. */
export const getRecentSessions = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId),
      )
      .order("desc")
      .take(SESSIONS_LIMIT);
    return rows.map((s) => ({
      state: s.state,
      entryType: s.entryType,
      confirmationState: s.confirmationState ?? null,
      pathChosen: s.pathChosen ?? null,
      mirrorText: s.mirrorText ?? null,
      postSessionMood: s.postSessionMood ?? null,
      createdAt: s.createdAt,
    }));
  },
});

/** Post-session mood signal over recent sessions (lighter/same/heavier). */
export const getMoodDeltas = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId),
      )
      .order("desc")
      .take(MOOD_LIMIT);
    return rows
      .filter((s) => s.postSessionMood !== undefined)
      .map((s) => ({
        postSessionMood: s.postSessionMood,
        createdAt: s.createdAt,
      }));
  },
});

/** Aggregate "what lands": confirmation outcomes + tone tallies. */
export const getConfirmationStats = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId),
      )
      .order("desc")
      .take(STATS_LIMIT);

    const confirmation: Record<string, number> = {};
    const tone: Record<string, number> = {};
    for (const s of rows) {
      if (s.confirmationState) {
        confirmation[s.confirmationState] =
          (confirmation[s.confirmationState] ?? 0) + 1;
      }
      if (s.toneUsed) {
        tone[s.toneUsed] = (tone[s.toneUsed] ?? 0) + 1;
      }
    }
    return { sampleSize: rows.length, confirmation, tone };
  },
});

/** The current narrative profile, rendered whole (never vector-searched). */
export const readSemanticProfile = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get("emotional_profiles", args.emotionalProfileId);
    if (!profile?.currentSemanticProfileId) {
      return { version: null as number | null, rendered: null as string | null };
    }
    const doc = await ctx.db.get("semantic_profiles", profile.currentSemanticProfileId);
    if (!doc) {
      return { version: null as number | null, rendered: null as string | null };
    }
    return { version: doc.version, rendered: renderSemanticProfile(doc) };
  },
});
