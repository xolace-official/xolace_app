"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getAnthropicClient, extractTextFromResponse } from "./providers/anthropic";
import { buildNotificationPrompt } from "./prompts/notificationWriter";
import { pickTemplate, pickFallbackTemplate } from "./prompts/notificationTemplates";

const NOTIFICATION_MODEL = "claude-haiku-4-5-20251001";
const COLD_START_THRESHOLD = 3;

/**
 * Generate personalized notification copy via Haiku, or fall back to
 * curated templates for cold-start users (<3 sessions).
 *
 * Designed to be scheduled by notificationTriggers mutations.
 */
export const generate = internalAction({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    notificationType: v.union(
      v.literal("gentle_return"),
      v.literal("pattern_nudge")
    ),
    triggerReason: v.string(),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(
      internal.notifications.loadGenerationContext,
      { emotionalProfileId: args.emotionalProfileId }
    );

    if (!context) return;

    const { profile, preferences, lastSession, userLanguageTags, recentNotificationContent } = context;

    const reach = preferences?.notifications.reach ?? "warm";
    const sessionCount = profile.sessionCount;

    // Cold-start path: no personalization until we have enough sessions
    if (sessionCount < COLD_START_THRESHOLD) {
      const { content, generatedBy } = pickTemplate(
        reach,
        args.notificationType,
        recentNotificationContent
      );

      await ctx.runMutation(internal.notifications.schedule, {
        emotionalProfileId: args.emotionalProfileId,
        type: args.notificationType,
        content,
        triggerReason: args.triggerReason,
        scheduledFor: args.scheduledFor,
        reachUsed: reach,
        patternContextUsed: false,
        generatedBy,
      });
      return;
    }

    // Personalized path: build context and call Haiku
    const now = Date.now();
    const hoursSinceLastSession = profile.lastSessionAt
      ? (now - profile.lastSessionAt) / (1000 * 60 * 60)
      : 48;

    const notificationCtx = {
      notificationType: args.notificationType,
      reach,
      sessionCount,
      currentStreak: profile.currentStreak,
      hoursSinceLastSession,
      dominantEmotionTags: profile.dominantEmotionTags.slice(0, 3),
      userLanguageTags,
      typicalUsagePattern: profile.typicalUsagePattern ?? null,
      lastSessionMood: (lastSession?.postSessionMood as "lighter" | "same" | "heavier" | "unsure" | undefined) ?? null,
      lastMirrorConfirmation: (lastSession?.confirmationState as "confirmed" | "refined" | "gave_up" | "abandoned" | undefined) ?? null,
    };

    const patternContextUsed =
      userLanguageTags.length > 0 || profile.dominantEmotionTags.length > 0;

    let content: string;
    let generatedBy: "haiku_personalized" | "template_cold_start" | "template_fallback";

    try {
      const anthropic = getAnthropicClient();
      const prompt = buildNotificationPrompt(notificationCtx);

      const response = await anthropic.messages.create({
        model: NOTIFICATION_MODEL,
        max_tokens: 120,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      });

      const raw = extractTextFromResponse(response).trim();

      // Validate: must be non-empty and within length limit
      if (raw && raw.length <= 120) {
        content = raw;
        generatedBy = "haiku_personalized";
      } else {
        const fallback = pickFallbackTemplate(reach, args.notificationType, recentNotificationContent);
        content = fallback.content;
        generatedBy = fallback.generatedBy;
      }
    } catch {
      const fallback = pickFallbackTemplate(reach, args.notificationType, recentNotificationContent);
      content = fallback.content;
      generatedBy = fallback.generatedBy;
    }

    await ctx.runMutation(internal.notifications.schedule, {
      emotionalProfileId: args.emotionalProfileId,
      type: args.notificationType,
      content,
      triggerReason: args.triggerReason,
      scheduledFor: args.scheduledFor,
      reachUsed: reach,
      patternContextUsed,
      generatedBy,
    });
  },
});
