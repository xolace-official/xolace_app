import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireAuth, requireSessionOwnership } from "./lib/auth";

/**
 * Match reflections for a session based on its emotional metadata.
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

    // Try granular match first
    let reflections = await ctx.db
      .query("reflections")
      .withIndex("by_granular", (q) =>
        q
          .eq("granularLabel", metadata.granularLabel ?? undefined)
          .eq("status", "active")
      )
      .take(10);

    // Fall back to broad emotion match
    if (reflections.length < 3) {
      const broadMatches = await ctx.db
        .query("reflections")
        .withIndex("by_emotion", (q) =>
          q.eq("primaryEmotion", metadata.primaryEmotion).eq("status", "active")
        )
        .take(10);

      // Merge without duplicates
      const existingIds = new Set(reflections.map((r) => r._id));
      for (const match of broadMatches) {
        if (!existingIds.has(match._id)) {
          reflections.push(match);
        }
      }
    }

    // Filter by intensity proximity (within ±3 of session intensity)
    const intensityFiltered = reflections.filter(
      (r) => Math.abs(r.intensity - metadata.intensity) <= 3
    );

    // Sort by resonance count (most resonant first), take 5
    return intensityFiltered
      .sort((a, b) => b.resonanceCount - a.resonanceCount)
      .slice(0, 5);
  },
});

/**
 * "I feel this too" — increment resonance count.
 */
export const incrementResonance = mutation({
  args: {
    reflectionId: v.id("reflections"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const reflection = await ctx.db.get(args.reflectionId);
    if (!reflection) {
      throw new Error("Reflection not found");
    }

    await ctx.db.patch(args.reflectionId, {
      resonanceCount: reflection.resonanceCount + 1,
    });

    return null;
  },
});

/**
 * Insert an anonymized reflection into the pool.
 * No profile reference — anonymity is structural.
 */
export const contribute = internalMutation({
  args: {
    displayText: v.string(),
    primaryEmotion: v.string(),
    granularLabel: v.optional(v.string()),
    thematicTags: v.array(v.string()),
    intensity: v.number(),
  },
  handler: async (ctx, args) => {
    // Round to nearest day for timing anonymization
    const now = Date.now();
    const roundedDay = Math.floor(now / 86400000) * 86400000;

    await ctx.db.insert("reflections", {
      displayText: args.displayText,
      primaryEmotion: args.primaryEmotion,
      granularLabel: args.granularLabel,
      thematicTags: args.thematicTags,
      intensity: args.intensity,
      resonanceCount: 0,
      status: "active",
      isSeed: false,
      addedAt: roundedDay,
    });
  },
});

/**
 * Seed curated reflections into the pool.
 */
export const seed = internalMutation({
  args: {
    reflections: v.array(
      v.object({
        displayText: v.string(),
        primaryEmotion: v.string(),
        granularLabel: v.optional(v.string()),
        thematicTags: v.array(v.string()),
        intensity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const roundedDay = Math.floor(now / 86400000) * 86400000;

    for (const reflection of args.reflections) {
      await ctx.db.insert("reflections", {
        ...reflection,
        resonanceCount: 0,
        status: "active",
        isSeed: true,
        addedAt: roundedDay,
      });
    }
  },
});
