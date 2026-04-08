import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./lib/rateLimits";
import { pushNotifications } from "./lib/pushNotifications";

/**
 * Schedule a notification for delivery.
 * Rate-limited, then dispatched via the push notifications component.
 * Also logs to notification_log for analytics.
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

    // Dispatch via push notifications component.
    // allowUnregisteredTokens: true — don't throw if user hasn't
    // registered a token yet (e.g. notifications enabled in prefs
    // but app not yet opened on a physical device).
    await pushNotifications.sendPushNotification(ctx, {
      userId: args.emotionalProfileId,
      notification: {
        title: "Xolace",
        body: args.content,
        data: { type: args.type },
      },
      allowUnregisteredTokens: true,
    });

    // Log for analytics (what was sent and why)
    await ctx.db.insert("notification_log", {
      emotionalProfileId: args.emotionalProfileId,
      type: args.type,
      content: args.content,
      triggerReason: args.triggerReason,
      delivered: true,
      sentAt: now,
      scheduledFor: args.scheduledFor,
      createdAt: now,
    });
  },
});

/**
 * Register an Expo push token for the authenticated user.
 * Called from the client after obtaining permissions and a token.
 */
export const registerToken = mutation({
  args: {
    pushToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    await pushNotifications.recordToken(ctx, {
      userId: profile._id,
      pushToken: args.pushToken,
    });

    // Auto-enable notification preferences on first token registration
    // so cron jobs include this user. If the user later disables via
    // Settings, removeToken is called and preferences are set to false.
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    if (preferences && !preferences.notifications.enabled) {
      await ctx.db.patch(preferences._id, {
        notifications: {
          enabled: true,
          gentleReturn: true,
          patternNudge: true,
          milestone: true,
        },
      });
    }

    return null;
  },
});

/**
 * Remove the push token for the authenticated user.
 * Called when the user disables notifications.
 */
export const removeToken = mutation({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    await pushNotifications.removeToken(ctx, {
      userId: profile._id,
    });

    return null;
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
