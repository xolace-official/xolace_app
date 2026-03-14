import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { requireAuth, requireSessionOwnership } from "./lib/auth";

/**
 * Match exercises for a session based on its emotional metadata.
 * Accepts sessionId, verifies ownership, derives emotion from metadata.
 */
export const matchForSession = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    await requireSessionOwnership(ctx, args.sessionId);

    // Get emotional metadata for this session
    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!metadata) {
      return [];
    }

    // Get all active exercises
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_active", (q) => q.eq("active", true))
      .take(50);

    // Filter by emotion match and intensity range
    const matched = exercises.filter((exercise) => {
      const emotionMatch = exercise.targetEmotions.includes(
        metadata.primaryEmotion
      );
      const intensityMatch =
        metadata.intensity >= exercise.intensityRange.min &&
        metadata.intensity <= exercise.intensityRange.max;
      return emotionMatch && intensityMatch;
    });

    return matched.slice(0, 3);
  },
});

/**
 * Get a single exercise by ID.
 */
export const getById = query({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.exerciseId);
  },
});

/**
 * Seed exercises into the library.
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
          v.literal("journaling_prompt")
        ),
        targetEmotions: v.array(v.string()),
        intensityRange: v.object({
          min: v.number(),
          max: v.number(),
        }),
        steps: v.array(
          v.object({
            order: v.number(),
            content: v.string(),
            durationSeconds: v.optional(v.number()),
            type: v.union(
              v.literal("text"),
              v.literal("timer"),
              v.literal("prompt")
            ),
          })
        ),
        estimatedMinutes: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const exercise of args.exercises) {
      await ctx.db.insert("exercises", {
        ...exercise,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
