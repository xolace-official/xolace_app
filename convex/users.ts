import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth } from "./lib/auth";

/**
 * Idempotent onboarding: find existing user by tokenIdentifier
 * or create user + emotional_profile + preferences + initial consent.
 */
export const getOrCreate = mutation({
  args: {
    authProvider: v.union(v.literal("apple"), v.literal("google")),
    authProviderAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("getOrCreate", args);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log("getOrCreate-error: not authenticated");
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      // Grace period: if the user signed back in before the cron
      // purged their account, cancel the deletion and reactivate.
      if (existingUser.accountStatus === "deleted") {
        await ctx.db.patch(existingUser._id, {
          accountStatus: "active",
          deletionRequestedAt: undefined,
          updatedAt: Date.now(),
        });
      }
      return existingUser._id;
    }

    const now = Date.now();

    // Create emotional profile
    const profileId = await ctx.db.insert("emotional_profiles", {
      onboardingComplete: false,
      sessionCount: 0,
      currentStreak: 0,
      dominantEmotionTags: [],
      createdAt: now,
      updatedAt: now,
    });

    // Create preferences with defaults
    await ctx.db.insert("preferences", {
      emotionalProfileId: profileId,
      theme: "system",
      reducedMotion: false,
      notifications: {
        enabled: false,
        gentleReturn: false,
        patternNudge: false,
        milestone: false,
      },
      mirrorTone: "adaptive",
      contributeByDefault: false,
      dataRetentionPreference: "indefinite",
      preferredInputType: "text",
    });

    // Create user
    const userId = await ctx.db.insert("users", {
      authProvider: args.authProvider,
      authProviderAccountId: args.authProviderAccountId,
      emotionalProfileId: profileId,
      tokenIdentifier: identity.tokenIdentifier,
      accountStatus: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Initial consent records
    const consentTypes = [
      "reflection_pool_contribution",
      "nudge_delivery",
      "pattern_analysis",
    ] as const;

    for (const consentType of consentTypes) {
      await ctx.db.insert("consent_records", {
        emotionalProfileId: profileId,
        consentType,
        status: "granted",
        consentLanguageVersion: "1.0",
        grantedAt: now,
        createdAt: now,
      });
    }

    return userId;
  },
});

/**
 * Return the current authenticated user document.
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireAuth(ctx);
    return user;
  },
});

/**
 * App open: return user + profile + preferences in one call.
 */
export const getFullContext = query({
  args: {},
  handler: async (ctx) => {
    const { user, profile } = await requireAuth(ctx);

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    return { user, profile, preferences };
  },
});

/**
 * Soft-delete: set accountStatus to "deleted" and record timestamp.
 * A background job will purge associated data.
 */
export const requestDeletion = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireAuth(ctx);

    await ctx.db.patch(user._id, {
      accountStatus: "deleted",
      deletionRequestedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Wipe all user content (sessions, reflections, emotional history) while
 * keeping the account, profile shell, preferences, and consent records intact.
 * Schedules a background job that processes deletions in batches.
 *
 * Idempotent: repeated calls while a wipe is in progress are no-ops.
 */
export const requestDataWipe = mutation({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    if (profile.dataWipeInProgress) {
      return null;
    }

    await ctx.db.patch(profile._id, { dataWipeInProgress: true });

    await ctx.scheduler.runAfter(0, internal.jobs.dataWipe.wipe, {
      emotionalProfileId: profile._id,
    });

    return null;
  },
});
