import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { requireSessionOwnership } from "./lib/auth";
import {
  safeguardLevelValidator,
  triggerTypeValidator,
} from "./lib/validators";
import { adjustImportance, DEFAULT_IMPORTANCE } from "./episodicImportance";
import {
  isInSuggestionCooldown,
  suggestedSpecialty,
  SUGGESTION_COOLDOWN_MS,
  type SuggestionInput,
} from "./lib/xolacerSuggestion";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * The two IO gates the pure suggestion module deliberately doesn't own: a
 * user already talking to someone, and the 7-day cooldown. Both are plain
 * index scans, so wrapping them would add a seam that only tests array
 * membership.
 *
 * `sessionId` is excluded from the cooldown walk so a pipeline retry — the
 * store mutation is an idempotent upsert — doesn't see its own earlier write
 * and suppress the suggestion it already made.
 */
async function resolveSuggestedSpecialty(
  ctx: MutationCtx,
  args: SuggestionInput & {
    sessionId: Id<"sessions">;
    emotionalProfileId: Id<"emotional_profiles">;
  },
) {
  const specialty = suggestedSpecialty(args);
  if (!specialty) return undefined;

  // Never talk over a request the user is already waiting on.
  for (const status of ["requested", "open", "resting"] as const) {
    const live = await ctx.db
      .query("xolacer_conversations")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userProfileId", args.emotionalProfileId).eq("status", status),
      )
      .first();
    if (live) return undefined;
  }

  // Streamed rather than collected: the predicate short-circuits, so a user
  // who *was* suggested recently stops at the first hit. Only the common
  // no-suggestion case walks the window, and that is one row per session for
  // one user over 7 days — bounded and small, which is why no timestamp field
  // exists. The rule itself stays in the pure module; this only feeds it.
  const now = Date.now();
  for await (const row of ctx.db
    .query("emotional_metadata")
    .withIndex("by_profile_createdAt", (q) =>
      q
        .eq("emotionalProfileId", args.emotionalProfileId)
        .gte("createdAt", now - SUGGESTION_COOLDOWN_MS),
    )) {
    if (row.sessionId === args.sessionId) continue;
    if (isInSuggestionCooldown([row], now)) return undefined;
  }

  return specialty;
}

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

    // Part of the Understanding, decided here because every input it needs is
    // already an argument. undefined clears the field on a re-classify.
    const row = {
      ...args,
      suggestedSpecialty: await resolveSuggestedSpecialty(ctx, args),
    };

    if (existing) {
      await ctx.db.patch(existing._id, row);
      return;
    }
    await ctx.db.insert("emotional_metadata", {
      ...row,
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
