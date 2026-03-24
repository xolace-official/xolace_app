"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getAnthropicClient,
  extractTextFromResponse,
  parseClassificationResponse,
  CLASSIFIER_MODEL,
  CLASSIFIER_VERSION,
  ARTICULATOR_MODEL,
  ARTICULATOR_VERSION,
} from "./providers/anthropic";
import { moderateInput } from "./providers/moderation";
import { buildClassifierPrompt } from "./prompts/classifier";
import { buildArticulatorPrompt } from "./prompts/articulator";
import { evaluateSafeguard } from "./safeguard";
import {
  buildPatternSummary,
  collectRecentMirrors,
} from "./helpers/patternSummary";

import type { SessionContext } from "./context";
import type { ClassificationResult } from "./providers/anthropic";

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

      // 2. Build pattern summary (pure function)
      const mirrorTone = context.preferences?.mirrorTone ?? "adaptive";
      const patternSummary = buildPatternSummary({
        profile: context.profile,
        recentMetadata: context.recentMetadata,
        recentSessions: context.recentSessions,
        isFirstSession: context.isFirstSession,
        mirrorTone,
      });

      // 3. Parallel: moderation + classification
      const anthropic = getAnthropicClient();

      const classifierPrompt = buildClassifierPrompt(
        args.rawText,
        patternSummary,
        context.isFirstSession
      );

      const [moderationResult, classificationResponse] = await Promise.all([
        moderateInput(args.rawText),
        anthropic.messages.create({
          model: CLASSIFIER_MODEL,
          max_tokens: 512,
          system: classifierPrompt.system,
          messages: [{ role: "user", content: classifierPrompt.user }],
        }),
      ]);

      // 4. Parse classification
      let classification: ClassificationResult;
      const rawClassification = extractTextFromResponse(classificationResponse);

      try {
        classification = parseClassificationResponse(rawClassification);
      } catch {
        // Retry once with stricter instruction
        const retryResponse = await anthropic.messages.create({
          model: CLASSIFIER_MODEL,
          max_tokens: 512,
          system: classifierPrompt.system,
          messages: [
            { role: "user", content: classifierPrompt.user },
            { role: "assistant", content: rawClassification },
            {
              role: "user",
              content:
                "Your response was not valid JSON. Respond with ONLY a valid JSON object, no other text.",
            },
          ],
        });
        classification = parseClassificationResponse(
          extractTextFromResponse(retryResponse)
        );
      }

      // 5. Evaluate safeguard (rule engine, no LLM)
      const safeguard = evaluateSafeguard(
        classification,
        moderationResult,
        context.recentMetadata
      );

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
          inputDuration: context.session.inputDuration as number | undefined,
          freezeOccurred: context.session.freezeOccurred as boolean | undefined,
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

      // 7. Deliver mirror
      await ctx.runMutation(internal.sessions.deliverMirror, {
        sessionId: args.sessionId,
        mirrorText,
        mirrorModelVersion: ARTICULATOR_VERSION,
      });

      // 8. Store emotional metadata
      const session = context.session as {
        emotionalProfileId: string;
        [key: string]: unknown;
      };

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
          safeguard.level === "crisis" || safeguard.level === "elevated",
      });

      // 9. Create escalation event if needed
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
