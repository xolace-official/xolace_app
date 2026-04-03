import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./lib/rateLimits";

/**
 * Schedule a notification for delivery.
 * Includes rate limit check to prevent spam.
 */
export const schedule = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    type: v.union(
      v.literal("gentle_return"),
      v.literal("pattern_nudge"),
      v.literal("milestone")
    ),
    content: v.string(),
    triggerReason: v.string(),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Rate limit: 1 notification per 24 hours per profile
    const { ok } = await rateLimiter.limit(ctx, "notification", {
      key: args.emotionalProfileId,
    });

    if (!ok) {
      // Suppress: too recent
      await ctx.db.insert("notification_log", {
        emotionalProfileId: args.emotionalProfileId,
        type: args.type,
        content: args.content,
        triggerReason: args.triggerReason,
        delivered: false,
        suppressedReason: "rate_limit",
        scheduledFor: args.scheduledFor,
        createdAt: now,
      });
      return;
    }

    await ctx.db.insert("notification_log", {
      emotionalProfileId: args.emotionalProfileId,
      type: args.type,
      content: args.content,
      triggerReason: args.triggerReason,
      delivered: false,
      scheduledFor: args.scheduledFor,
      createdAt: now,
    });
  },
});

/**
 * Mark a notification as delivered.
 */
export const markDelivered = internalMutation({
  args: {
    notificationId: v.id("notification_log"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      delivered: true,
      sentAt: Date.now(),
    });
  },
});

/**
 * List recent notifications for the current user's profile.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    return await ctx.db
      .query("notification_log")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .order("desc")
      .take(20);
  },
});
