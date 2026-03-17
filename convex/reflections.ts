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
 * Toggle "I feel this too" — insert or delete resonance record.
 * Returns { resonated: boolean } so the client knows the new state.
 */
export const toggleResonance = mutation({
  args: {
    reflectionId: v.id("reflections"),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const reflection = await ctx.db.get(args.reflectionId);
    if (!reflection) {
      throw new Error("Reflection not found");
    }

    const existing = await ctx.db
      .query("reflection_resonances")
      .withIndex("by_profile_reflection", (q) =>
        q
          .eq("emotionalProfileId", profile._id)
          .eq("reflectionId", args.reflectionId)
      )
      .unique();

    if (existing) {
      // Un-resonate
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.reflectionId, {
        resonanceCount: Math.max(0, reflection.resonanceCount - 1),
      });
      return { resonated: false };
    }

    // Resonate
    await ctx.db.insert("reflection_resonances", {
      emotionalProfileId: profile._id,
      reflectionId: args.reflectionId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.reflectionId, {
      resonanceCount: reflection.resonanceCount + 1,
    });
    return { resonated: true };
  },
});

/**
 * Batch check whether the current user has resonated with a set of reflections.
 */
export const hasResonated = query({
  args: {
    reflectionIds: v.array(v.id("reflections")),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const result: Record<string, boolean> = {};
    for (const reflectionId of args.reflectionIds) {
      const existing = await ctx.db
        .query("reflection_resonances")
        .withIndex("by_profile_reflection", (q) =>
          q
            .eq("emotionalProfileId", profile._id)
            .eq("reflectionId", reflectionId)
        )
        .unique();
      result[reflectionId] = !!existing;
    }
    return result;
  },
});

/**
 * Fallback: list recent active reflections when matchForSession returns empty.
 */
export const listRecent = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    return await ctx.db
      .query("reflections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(Math.min(args.limit, 20));
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
