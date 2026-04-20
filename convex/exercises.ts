import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { requireAuth, requireSessionOwnership } from "./lib/auth";
import { matchExercise } from "./exercises/match";

const stepValidator = v.object({
  order: v.number(),
  content: v.string(),
  defaultContent: v.optional(v.string()),
  durationSeconds: v.optional(v.number()),
  type: v.union(
    v.literal("text"),
    v.literal("timer"),
    v.literal("prompt"),
    v.literal("breath"),
    v.literal("haptic"),
    v.literal("private_prompt"),
  ),
  breathPattern: v.optional(v.union(
    v.literal("physiological_sigh"),
    v.literal("extended_exhale"),
    v.literal("slow_exhale"),
  )),
  breathCycles: v.optional(v.number()),
  hapticIntensity: v.optional(v.union(
    v.literal("light"),
    v.literal("medium"),
    v.literal("heavy"),
  )),
  slotKeys: v.optional(v.array(v.string())),
  promptPlaceholder: v.optional(v.string()),
  promptMaxSeconds: v.optional(v.number()),
  syncToBreath: v.optional(v.boolean()),
});

/**
 * Get the active exercise for a running session (matched or latest swap).
 * Returns exercise doc + filled slot values.
 */
export const getForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    const swapped = session.swappedExerciseIds;
    const exerciseId =
      swapped && swapped.length > 0
        ? swapped[swapped.length - 1]
        : (session.matchedExerciseId ?? null);

    if (!exerciseId) {
      const fallback = await ctx.db
        .query("exercises")
        .withIndex("by_title", (q) => q.eq("title", "let_it_land"))
        .unique();
      if (!fallback) return null;
      return { exercise: fallback, slots: {} as Record<string, string> };
    }

    const exercise = await ctx.db.get(exerciseId);
    if (!exercise) return null;

    return {
      exercise,
      slots: (session.exerciseSlots ?? {}) as Record<string, string>,
    };
  },
});

/**
 * Match exercises for a session based on its emotional metadata.
 */
export const matchForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await requireSessionOwnership(ctx, args.sessionId);

    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!metadata) return [];

    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_active", (q) => q.eq("active", true))
      .take(50);

    return exercises
      .filter((e) => {
        const emotionMatch = e.targetEmotions.includes(metadata.primaryEmotion);
        const intensityMatch =
          metadata.intensity >= e.intensityRange.min &&
          metadata.intensity <= e.intensityRange.max;
        return emotionMatch && intensityMatch;
      })
      .slice(0, 3);
  },
});

/**
 * Get ranked swap options for a session (reset + next-best).
 * Returns IDs only — client passes to recordSwap.
 */
export const getSwapOptions = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    const resetDoc = await ctx.db
      .query("exercises")
      .withIndex("by_title", (q) => q.eq("title", "reset"))
      .unique();

    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!metadata) {
      return { resetId: resetDoc?._id ?? null, nextBestId: null };
    }

    const ranked = matchExercise({
      primaryEmotion: metadata.primaryEmotion,
      granularLabel: metadata.granularLabel,
      intensity: metadata.intensity,
      userLanguageTags: metadata.userLanguageTags,
      entryType: session.entryType ?? "open_prompt",
      confirmationState: "confirmed",
    });

    const currentId = session.swappedExerciseIds?.length
      ? session.swappedExerciseIds[session.swappedExerciseIds.length - 1]
      : (session.matchedExerciseId ?? null);

    const nextBestTitle = ranked.find((t) => t !== "reset") ?? null;
    const nextBestDoc = nextBestTitle
      ? await ctx.db
          .query("exercises")
          .withIndex("by_title", (q) => q.eq("title", nextBestTitle))
          .unique()
      : null;

    const nextBestId =
      nextBestDoc && nextBestDoc._id !== currentId ? nextBestDoc._id : null;

    return { resetId: resetDoc?._id ?? null, nextBestId };
  },
});

/**
 * Get a single exercise by ID.
 */
export const getById = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.exerciseId);
  },
});

/**
 * Record an exercise swap for a session (max 2 swaps enforced).
 */
export const recordSwap = mutation({
  args: {
    sessionId: v.id("sessions"),
    newExerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    const currentSwaps = session.swappedExerciseIds ?? [];
    if (currentSwaps.length >= 2) throw new Error("Maximum swaps reached");

    const exercise = await ctx.db.get(args.newExerciseId);
    if (!exercise) throw new Error("Exercise not found");

    await ctx.db.patch(args.sessionId, {
      swappedExerciseIds: [...currentSwaps, args.newExerciseId],
    });
  },
});

/**
 * Look up an exercise by internal title.
 */
export const getByTitle = internalQuery({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exercises")
      .withIndex("by_title", (q) => q.eq("title", args.title))
      .unique();
  },
});

/**
 * Set the matched exercise on a session (called from generateMirror).
 */
export const setMatched = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    matchedExerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    await ctx.db.patch(args.sessionId, {
      matchedExerciseId: args.matchedExerciseId,
    });
  },
});

/**
 * Seed exercises into the library (upserts by title).
 */
export const seed = internalMutation({
  args: {
    exercises: v.array(
      v.object({
        title: v.string(),
        type: v.union(
          v.literal("breathing"),
          v.literal("body_scan"),
          v.literal("grounding"),
          v.literal("self_compassion"),
          v.literal("cognitive_reframe"),
          v.literal("visualization"),
          v.literal("journaling_prompt"),
        ),
        targetEmotions: v.array(v.string()),
        intensityRange: v.object({ min: v.number(), max: v.number() }),
        steps: v.array(stepValidator),
        estimatedMinutes: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const exercise of args.exercises) {
      const existing = await ctx.db
        .query("exercises")
        .withIndex("by_title", (q) => q.eq("title", exercise.title))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { ...exercise, updatedAt: now });
      } else {
        await ctx.db.insert("exercises", {
          ...exercise,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});
