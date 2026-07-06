import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { requireSessionOwnership } from "./lib/auth";
import {
  safeguardLevelValidator,
  triggerTypeValidator,
} from "./lib/validators";
import { adjustImportance, DEFAULT_IMPORTANCE } from "./episodicImportance";

/**
 * AI stores the emotional classification for a session.
 */
export const store = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    emotionalProfileId: v.id("emotional_profiles"),
    classifierVersion: v.string(),
    primaryEmotion: v.string(),
    primaryEmotionConfidence: v.number(),
    granularLabel: v.optional(v.string()),
    secondaryEmotion: v.optional(v.string()),
    intensity: v.number(),
    specificity: v.number(),
    thematicTags: v.array(v.string()),
    userLanguageTags: v.array(v.string()),
    temporalContext: v.optional(
      v.union(
        v.literal("past_focused"),
        v.literal("present_focused"),
        v.literal("future_focused")
      )
    ),
    riskFlag: v.boolean(),
    // Understanding fields (Cognition Layer Phase 2): full safeguard
    // verdict, episodic memories in context, semantic profile version.
    safeguardLevel: v.optional(safeguardLevelValidator),
    safeguardTrigger: v.optional(triggerTypeValidator),
    episodicMatchKeys: v.optional(v.array(v.string())),
    profileVersion: v.optional(v.number()),
    // Follow-up system: brief internal reason from the classifier. Never
    // shown to the user. Present only when the classifier flagged a follow-up.
    followUpReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Idempotent per session: the pipeline can legitimately re-run (a retry
    // after a partial failure past this step) and every reader assumes a
    // 1:1 session→row invariant via .unique(). Upsert to guarantee it.
    const existing = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return;
    }
    await ctx.db.insert("emotional_metadata", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Phase 4, Loop #3 — nudge one memory's salience weight from confirmation
 * feedback. Cheap and transactional: reads the current weight, applies the
 * bump/decay, patches. Returns whether the weight actually moved so the
 * caller can skip the (expensive) re-embed on a no-op or missing row.
 * `feedback` is a terminal confirmationState; only "confirmed"/"gave_up"
 * move the weight (see episodicImportance.ts).
 */
export const adjustEpisodicImportance = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    feedback: v.union(
      v.literal("confirmed"),
      v.literal("refined"),
      v.literal("gave_up"),
      v.literal("abandoned"),
    ),
  },
  handler: async (ctx, args): Promise<{ changed: boolean }> => {
    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    // No Understanding row → this memory was never classified/embedded.
    if (!metadata) return { changed: false };

    // Compare against the effective current weight (undefined = default), so a
    // neutral nudge or one already clamped at a boundary writes nothing and
    // skips the caller's re-embed.
    const current = metadata.episodicImportance ?? DEFAULT_IMPORTANCE;
    const next = adjustImportance(metadata.episodicImportance, args.feedback);
    if (next === current) return { changed: false };

    await ctx.db.patch(metadata._id, { episodicImportance: next });
    return { changed: true };
  },
});

/**
 * Get emotional metadata for a session (with ownership check).
 */
export const getBySession = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    await requireSessionOwnership(ctx, args.sessionId);

    return await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});

/**
 * Get emotional metadata for a session (internal, no auth check).
 * Used by AI actions that already verified session ownership.
 */
export const getBySessionInternal = internalQuery({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});

/**
 * Get recent emotional metadata for a profile (for AI context building).
 */
export const getRecentByProfile = internalQuery({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_theme", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId)
      )
      .order("desc")
      .take(limit);
  },
});
