import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { requireSessionOwnership } from "./lib/auth";
import {
  safeguardLevelValidator,
  triggerTypeValidator,
} from "./lib/validators";

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
