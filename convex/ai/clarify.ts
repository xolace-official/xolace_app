"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getAnthropicClient,
  extractTextFromResponse,
  ARTICULATOR_MODEL,
  ARTICULATOR_VERSION,
} from "./providers/anthropic";
import { buildArticulatorPrompt } from "./prompts/articulator";
import { applyAudioFence } from "./prompts/mirrorAudioTags";
import { resolveMirrorTone } from "./mirrorPlan";
import { scheduleMirrorAudio } from "./tts";
import { routeUncertainty } from "./routing";
import {
  buildArticulatorPatternSummary,
  collectRecentMirrors,
} from "./helpers/patternSummary";
import { posthog } from "../posthog";

const FALLBACK_MIRROR =
  "I hear you more clearly now. What you're feeling deserves to be seen.";

/**
 * Handle clarification for refinement turns ("Not quite" / "Say more").
 *
 * Skips moderation + classification — reuses the existing classification
 * from the original session. Only re-articulates the mirror with new context.
 */
export const handleClarification = internalAction({
  args: {
    sessionId: v.id("sessions"),
    turnNumber: v.number(),
    additionalRawText: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let session: {
      mirrorText?: string;
      emotionalProfileId: string;
      entryType?: string;
      inputDuration?: number;
      freezeOccurred?: boolean;
      [key: string]: unknown;
    } | undefined;
    try {
      // 1. Load full context (includes turns + current mirror)
      const context = await ctx.runQuery(
        internal.ai.context.buildSessionContext,
        { sessionId: args.sessionId },
      );

      session = context.session as {
        mirrorText?: string;
        emotionalProfileId: string;
        entryType?: string;
        inputDuration?: number;
        freezeOccurred?: boolean;
        [key: string]: unknown;
      };

      // 2. Load existing emotional metadata for this session
      type MetadataType = {
        primaryEmotion: string;
        primaryEmotionConfidence: number;
        granularLabel?: string;
        secondaryEmotion?: string;
        intensity: number;
        specificity: number;
        thematicTags: string[];
        userLanguageTags: string[];
        temporalContext?: "past_focused" | "present_focused" | "future_focused";
      } | null;

      const metadata: MetadataType = await ctx.runQuery(
        internal.emotionalMetadata.getBySessionInternal,
        { sessionId: args.sessionId },
      );

      // If no metadata exists (edge case), we can't refine properly
      if (!metadata) {
        await ctx.runMutation(internal.sessions.failSession, {
          sessionId: args.sessionId,
          errorMessage: "No classification found for refinement",
        });
        return;
      }

      // 3. Find the current turn's feedback type
      const currentTurn = context.turns.find(
        (t: { turnNumber?: number }) => t.turnNumber === args.turnNumber,
      ) as { userFeedback?: string } | undefined;

      const userFeedback = currentTurn?.userFeedback as string | undefined;

      // 4. Build articulator prompt with refinement context
      // Real fence: same downgrade guard as the initial mirror (process.ts).
      const mirrorTone = resolveMirrorTone(
        context.preferences?.mirrorTone,
        context.isPremium,
      );
      // Clarify only re-articulates, so it uses the slim articulator variant.
      const patternSummary = buildArticulatorPatternSummary({
        recentMetadata: context.recentMetadata,
        isFirstSession: context.isFirstSession,
      });

      const recentMirrors = collectRecentMirrors(context.recentSessions);

      // Uncertainty routing (Phase 4, Loop #2) on the refinement pass. Same
      // deterministic gate as the initial mirror, off the stored confidence ×
      // specificity. But a "not quite" is empirical proof the read missed, so
      // never carry a "confident" posture into a rejected turn — floor it to
      // "measured". "say_more" adds context without rejecting, so it stands.
      const baseClaimStrength = routeUncertainty({
        confidence: metadata.primaryEmotionConfidence,
        specificity: metadata.specificity,
      });
      const claimStrength =
        userFeedback === "not_quite" && baseClaimStrength === "confident"
          ? "measured"
          : baseClaimStrength;

      const articulatorPrompt = buildArticulatorPrompt({
        rawInput: args.additionalRawText ?? "",
        classification: {
          primaryEmotion: metadata.primaryEmotion,
          primaryEmotionConfidence: metadata.primaryEmotionConfidence,
          granularLabel: metadata.granularLabel,
          secondaryEmotion: metadata.secondaryEmotion,
          intensity: metadata.intensity,
          specificity: metadata.specificity,
          thematicTags: metadata.thematicTags,
          userLanguageTags: metadata.userLanguageTags,
          temporalContext: metadata.temporalContext,
          // Clarify only re-articulates; the follow-up flag was finalized on
          // the initial pass and is not an articulation input.
          requiresFollowUp: false,
        },
        patternSummary,
        safeguardLevel: "none", // Already evaluated on initial pass
        mirrorTone,
        entryType: session.entryType ?? "open_prompt",
        isFirstSession: context.isFirstSession,
        recentMirrors,
        inputDuration: session.inputDuration,
        freezeOccurred: session.freezeOccurred,
        existingMirror: session.mirrorText,
        userFeedback,
        additionalInput: args.additionalRawText,
        spaceName: context.preferences?.spaceName,
        // Longitudinal Understanding: pass the semantic profile through so the
        // refinement is grounded in who this person is, matching process.ts.
        semanticProfile: context.semanticProfile,
        claimStrength,
        useAudioTags: context.isPremium,
      });

      // 5. Call Sonnet for revised mirror
      const anthropic = getAnthropicClient();

      let revisedMirrorText: string;
      try {
        const response = await anthropic.messages.create({
          model: ARTICULATOR_MODEL,
          max_tokens: 300,
          system: articulatorPrompt.system,
          messages: [{ role: "user", content: articulatorPrompt.user }],
        });

        revisedMirrorText = extractTextFromResponse(response).trim();
        if (!revisedMirrorText) {
          revisedMirrorText = FALLBACK_MIRROR;
        }
      } catch {
        revisedMirrorText = FALLBACK_MIRROR;
      }

      // Xolace+ audio tags live only in the TTS input (see applyAudioFence).
      const isFallback = revisedMirrorText === FALLBACK_MIRROR;
      const { ttsText, displayText } = applyAudioFence({
        mirrorText: revisedMirrorText,
        isFallback,
        isPremium: context.isPremium,
      });
      revisedMirrorText = displayText;

      // 6. Update the turn record with the revised mirror
      await ctx.runMutation(internal.sessionTurns.deliverRevisedMirror, {
        sessionId: args.sessionId,
        turnNumber: args.turnNumber,
        revisedMirrorText,
        modelVersion: ARTICULATOR_VERSION,
      });

      // 7. Update the session's displayed mirror
      await ctx.runMutation(internal.sessions.deliverMirror, {
        sessionId: args.sessionId,
        mirrorText: revisedMirrorText,
        mirrorModelVersion: ARTICULATOR_VERSION,
        toneUsed: mirrorTone,
      });
      await posthog.capture(ctx, {
        distinctId: session.emotionalProfileId,
        event: "clarify_delivered",
        properties: {
          turnNumber: args.turnNumber,
          hadAdditionalText: !!args.additionalRawText,
          claimStrength,
          usedFallback: revisedMirrorText === FALLBACK_MIRROR,
          userFeedback: userFeedback ?? "not_quite",
        },
      });

      // 7.5. Replace TTS: delete old audio file and schedule fresh generation.
      await scheduleMirrorAudio(ctx, {
        sessionId: args.sessionId,
        ttsText,
        isFallback,
        tone: mirrorTone,
        isPremium: context.isPremium,
        voice: context.preferences?.voice as string | undefined,
        replaceExisting: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during clarification";

      await ctx.runMutation(internal.sessions.failSession, {
        sessionId: args.sessionId,
        errorMessage,
      });
      await posthog.capture(ctx, {
        distinctId: session?.emotionalProfileId ?? (args.sessionId as string),
        event: "clarify_failed",
        properties: {
          turnNumber: args.turnNumber,
          errorType:
            error instanceof Error && error.message.includes("No classification")
              ? "missing_metadata"
              : "unknown",
        },
      });
    }
  },
});
