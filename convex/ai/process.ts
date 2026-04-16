"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getAnthropicClient,
  extractTextFromResponse,
  CLASSIFIER_VERSION,
  ARTICULATOR_MODEL,
  ARTICULATOR_VERSION,
} from "./providers/anthropic";
import { moderationCache, classifierCache } from "./cached";
import { MODERATION_UNAVAILABLE } from "./providers/moderation";
import { buildClassifierPrompt } from "./prompts/classifier";
import { buildArticulatorPrompt } from "./prompts/articulator";
import { evaluateSafeguard } from "./safeguard";
import {
  buildPatternSummary,
  collectRecentMirrors,
} from "./helpers/patternSummary";

import { rateLimiter } from "../lib/rateLimits";

import type { SessionContext } from "./context";

const FALLBACK_MIRROR =
  "I hear you, and what you're feeling matters.";

/**
 * Main AI orchestrator for mirror generation.
 *
 * Pipeline: context → parallel(moderation, classification) → safeguard
 *   → articulation → deliver mirror + store metadata + escalation
 */
export const generateMirror = internalAction({
  args: {
    sessionId: v.id("sessions"),
    rawText: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // 1. Load full context (single DB transaction)
      const context: SessionContext = await ctx.runQuery(
        internal.ai.context.buildSessionContext,
        { sessionId: args.sessionId }
      );

      // 1a. Rate limit AI requests (main cost control)
      const { ok, retryAfter } = await rateLimiter.limit(ctx, "aiMirrorRequest", {
        key: context.session.emotionalProfileId as string,
      });

      if (!ok) {
        const minutes = Math.ceil((retryAfter ?? 0) / 60000);
        const retryText = minutes > 0
          ? `Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`
          : "Try again in a few minutes.";

        await ctx.runMutation(internal.sessions.failSession, {
          sessionId: args.sessionId,
          errorMessage: `You've reached the limit for reflections. ${retryText}`,
        });
        return;
      }

      // 2. Build pattern summary (pure function)
      const mirrorTone = context.preferences?.mirrorTone ?? "adaptive";
      const patternSummary = buildPatternSummary({
        profile: context.profile,
        recentMetadata: context.recentMetadata,
        recentSessions: context.recentSessions,
        isFirstSession: context.isFirstSession,
        mirrorTone,
      });
      console.log("pattern Summary ", patternSummary)

      // 3. Parallel: moderation + classification (both cached)
      const anthropic = getAnthropicClient();

      const session = context.session as {
        entryType?: string;
        timeOfDay?: string;
        sessionMode?: "day" | "night";
        emotionalProfileId: string;
        [key: string]: unknown;
      };

      const classifierPrompt = buildClassifierPrompt(
        args.rawText,
        patternSummary,
        context.isFirstSession,
        session.entryType ?? "open_prompt",
        session.timeOfDay
      );
      console.log("classifier prompt ", classifierPrompt)

      // 4. Fetch moderation + classification in parallel (cache-backed)
      const [moderationResult, classification] = await Promise.all([
        moderationCache.fetch(ctx, { text: args.rawText }).catch(() => MODERATION_UNAVAILABLE),
        classifierCache.fetch(ctx, {
          systemPrompt: classifierPrompt.system,
          userPrompt: classifierPrompt.user,
        }),
      ]);

      // 5. Evaluate safeguard (rule engine, no LLM)
      const safeguard = evaluateSafeguard(
        classification,
        moderationResult,
        context.recentMetadata
      );
      console.log("safeguard ", safeguard)

      // 5a. If content should be rejected, fail the session
      if (safeguard.shouldReject) {
        await ctx.runMutation(internal.sessions.failSession, {
          sessionId: args.sessionId,
          errorMessage: safeguard.rejectionReason ?? "content_policy_violation",
        });
        return;
      }

      // 6. Articulate mirror (Sonnet)
      const recentMirrors = collectRecentMirrors(context.recentSessions);

      let mirrorText: string;
      try {
        const articulatorPrompt = buildArticulatorPrompt({
          rawInput: args.rawText,
          classification,
          patternSummary,
          safeguardLevel: safeguard.level,
          mirrorTone,
          isFirstSession: context.isFirstSession,
          recentMirrors,
          entryType: session.entryType ?? "open_prompt",
          inputDuration: context.session.inputDuration as number | undefined,
          freezeOccurred: context.session.freezeOccurred as boolean | undefined,
          sessionMode: session.sessionMode,
        });

        const mirrorResponse = await anthropic.messages.create({
          model: ARTICULATOR_MODEL,
          max_tokens: 300,
          system: articulatorPrompt.system,
          messages: [{ role: "user", content: articulatorPrompt.user }],
        });

        mirrorText = extractTextFromResponse(mirrorResponse).trim();

        // Fallback if Sonnet returned empty
        if (!mirrorText) {
          mirrorText = FALLBACK_MIRROR;
        }
      } catch {
        // Articulation failed — deliver fallback but still store classification
        mirrorText = FALLBACK_MIRROR;
      }

      // 7. Deliver mirror (include escalation flag atomically so the
      //    client sees both state and escalationTriggered in one update)
      const isEscalation =
        (safeguard.level === "crisis" || safeguard.level === "elevated") &&
        !!safeguard.triggerType;

      await ctx.runMutation(internal.sessions.deliverMirror, {
        sessionId: args.sessionId,
        mirrorText,
        mirrorModelVersion: ARTICULATOR_VERSION,
        ...(isEscalation ? {
          escalationTriggered: true,
          escalationResources: safeguard.resourcesPresented,
        } : {}),
      });

      // 8. Store emotional metadata
      await ctx.runMutation(internal.emotionalMetadata.store, {
        sessionId: args.sessionId,
        emotionalProfileId: session.emotionalProfileId as ReturnType<
          typeof v.id<"emotional_profiles">
        >["type"],
        classifierVersion: CLASSIFIER_VERSION,
        primaryEmotion: classification.primaryEmotion,
        primaryEmotionConfidence: classification.primaryEmotionConfidence,
        granularLabel: classification.granularLabel,
        secondaryEmotion: classification.secondaryEmotion,
        intensity: classification.intensity,
        specificity: classification.specificity,
        thematicTags: classification.thematicTags,
        userLanguageTags: classification.userLanguageTags,
        temporalContext: classification.temporalContext,
        riskFlag:
          (safeguard.level === "crisis" || safeguard.level === "elevated") &&
          safeguard.triggerType !== "pattern_escalation",
      });

      // 9. Schedule speculative distillation (for reflection pool)
      //    Skip if mirror is the fallback — nothing meaningful to distill.
      if (mirrorText !== FALLBACK_MIRROR) {
        await ctx.scheduler.runAfter(
          0,
          internal.jobs.reflectionDistiller.distill,
          {
            sessionId: args.sessionId,
            rawText: args.rawText,
            mirrorText,
            primaryEmotion: classification.primaryEmotion,
            granularLabel: classification.granularLabel,
            intensity: classification.intensity,
            thematicTags: classification.thematicTags,
            userLanguageTags: classification.userLanguageTags,
          }
        );
      }

      // 10. Create escalation event if needed
      if (
        (safeguard.level === "crisis" || safeguard.level === "elevated") &&
        safeguard.triggerType
      ) {
        await ctx.runMutation(internal.escalation.create, {
          emotionalProfileId: session.emotionalProfileId as ReturnType<
            typeof v.id<"emotional_profiles">
          >["type"],
          sessionId: args.sessionId,
          triggerType: safeguard.triggerType,
          triggerConfidence: safeguard.triggerConfidence,
          triggerEvidence: safeguard.triggerEvidence,
          actionTaken: safeguard.actionTaken,
          resourcesPresented: safeguard.resourcesPresented,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during AI processing";

      await ctx.runMutation(internal.sessions.failSession, {
        sessionId: args.sessionId,
        errorMessage,
      });
    }
  },
});
