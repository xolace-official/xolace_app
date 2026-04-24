import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./lib/rateLimits";
import { pushNotifications } from "./lib/pushNotifications";
import { updateNotificationPrefs } from "./lib/notificationPrefs";

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
      v.literal("milestone"),
      v.literal("affirmation")
    ),
    content: v.string(),
    triggerReason: v.string(),
    scheduledFor: v.number(),
    reachUsed: v.optional(v.union(v.literal("warm"), v.literal("direct"), v.literal("quiet"))),
    patternContextUsed: v.optional(v.boolean()),
    generatedBy: v.optional(v.union(
      v.literal("haiku_personalized"),
      v.literal("template_cold_start"),
      v.literal("template_fallback")
    )),
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
        ...(args.reachUsed && { reachUsed: args.reachUsed }),
        ...(args.patternContextUsed !== undefined && { patternContextUsed: args.patternContextUsed }),
        ...(args.generatedBy && { generatedBy: args.generatedBy }),
      });
      return;
    }

    // Insert log first so we have the ID to embed in the notification payload.
    // The client uses this ID to mark resultedInSession when the user taps.
    const logId = await ctx.db.insert("notification_log", {
      emotionalProfileId: args.emotionalProfileId,
      type: args.type,
      content: args.content,
      triggerReason: args.triggerReason,
      delivered: true,
      sentAt: now,
      scheduledFor: args.scheduledFor,
      createdAt: now,
      ...(args.reachUsed && { reachUsed: args.reachUsed }),
      ...(args.patternContextUsed !== undefined && { patternContextUsed: args.patternContextUsed }),
      ...(args.generatedBy && { generatedBy: args.generatedBy }),
    });

    // Dispatch via push notifications component.
    // allowUnregisteredTokens: true — don't throw if user hasn't
    // registered a token yet (e.g. notifications enabled in prefs
    // but app not yet opened on a physical device).
    await pushNotifications.sendPushNotification(ctx, {
      userId: args.emotionalProfileId,
      notification: {
        title: "Xolace",
        body: args.content,
        data: { type: args.type, logId },
      },
      allowUnregisteredTokens: true,
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
      await updateNotificationPrefs(ctx, profile._id, {
        enabled: true,
        gentleReturn: true,
        patternNudge: true,
        milestone: true,
        reach: preferences.notifications.reach ?? "warm",
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
 * Mark a notification as having resulted in a session.
 * Called from the client when the user taps a notification and opens the app.
 */
export const markResultedInSession = mutation({
  args: {
    logId: v.id("notification_log"),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const log = await ctx.db.get(args.logId);
    if (!log) return null;

    // Ownership check — only the profile that received it can mark it
    if (log.emotionalProfileId !== profile._id) return null;

    await ctx.db.patch(args.logId, { resultedInSession: true });
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
 * Record user feedback on a notification's emotional landing.
 * Called by the "What landed?" card shown after milestone sessions.
 */
export const recordLanded = internalMutation({
  args: {
    notificationId: v.id("notification_log"),
    landed: v.union(
      v.literal("felt_right"),
      v.literal("too_much"),
      v.literal("not_enough")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { landed: args.landed });
    return null;
  },
});

/**
 * Public version of recordLanded — called from the client feedback card.
 * Ownership-gated: only the receiving profile can record feedback.
 */
export const recordLandedPublic = mutation({
  args: {
    notificationId: v.id("notification_log"),
    landed: v.union(
      v.literal("felt_right"),
      v.literal("too_much"),
      v.literal("not_enough")
    ),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const log = await ctx.db.get(args.notificationId);
    if (!log || log.emotionalProfileId !== profile._id) return null;
    await ctx.db.patch(args.notificationId, { landed: args.landed });
    return null;
  },
});

/**
 * Load the context needed to generate a personalized notification.
 * Called by the generateNotification action.
 */
export const loadGenerationContext = internalQuery({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.emotionalProfileId);
    if (!profile) return null;

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId)
      )
      .unique();

    // Most recent completed session for mood/confirmation context
    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_state", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId).eq("state", "completed")
      )
      .order("desc")
      .take(1);
    const lastSession = recentSessions[0] ?? null;

    // Most recent emotional metadata for userLanguageTags
    const recentMetadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_theme", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId)
      )
      .order("desc")
      .take(3);

    // Recent notification content to avoid template repetition
    const recentNotifications = await ctx.db
      .query("notification_log")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId)
      )
      .order("desc")
      .take(5);

    // Aggregate userLanguageTags from recent metadata
    const tagFrequency: Record<string, number> = {};
    for (const meta of recentMetadata) {
      for (const tag of meta.userLanguageTags) {
        tagFrequency[tag] = (tagFrequency[tag] ?? 0) + 1;
      }
    }
    const userLanguageTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    return {
      profile,
      preferences,
      lastSession,
      userLanguageTags,
      recentNotificationContent: recentNotifications.map((n) => n.content),
    };
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
