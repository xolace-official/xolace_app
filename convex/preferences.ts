import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { mirrorToneValidator } from "./lib/validators";

/**
 * Fetch preferences for the current user's profile.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    if (!preferences) {
      throw new Error("Preferences not found");
    }

    return preferences;
  },
});

/**
 * Partial update of preferences. All fields optional.
 */
export const update = mutation({
  args: {
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
    ),
    reducedMotion: v.optional(v.boolean()),
    notifications: v.optional(
      v.object({
        enabled: v.boolean(),
        gentleReturn: v.boolean(),
        patternNudge: v.boolean(),
        milestone: v.boolean(),
      })
    ),
    mirrorTone: v.optional(mirrorToneValidator),
    autoContributeReflections: v.optional(v.boolean()),
    dataRetentionPreference: v.optional(
      v.union(
        v.literal("indefinite"),
        v.literal("6_months"),
        v.literal("1_year")
      )
    ),
    preferredInputType: v.optional(
      v.union(v.literal("text"), v.literal("voice"))
    ),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    if (!preferences) {
      throw new Error("Preferences not found");
    }

    // Build patch from provided args only
    const patch: Record<string, unknown> = {};
    if (args.theme !== undefined) patch.theme = args.theme;
    if (args.reducedMotion !== undefined) patch.reducedMotion = args.reducedMotion;
    if (args.notifications !== undefined) patch.notifications = args.notifications;
    if (args.mirrorTone !== undefined) patch.mirrorTone = args.mirrorTone;
    if (args.autoContributeReflections !== undefined)
      patch.autoContributeReflections = args.autoContributeReflections;
    if (args.dataRetentionPreference !== undefined)
      patch.dataRetentionPreference = args.dataRetentionPreference;
    if (args.preferredInputType !== undefined)
      patch.preferredInputType = args.preferredInputType;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(preferences._id, patch);
    }

    return null;
  },
});

/**
 * Store Expo push token for notifications.
 */
export const updatePushToken = mutation({
  args: {
    pushToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    if (!preferences) {
      throw new Error("Preferences not found");
    }

    await ctx.db.patch(preferences._id, {
      pushToken: args.pushToken,
    });

    return null;
  },
});
