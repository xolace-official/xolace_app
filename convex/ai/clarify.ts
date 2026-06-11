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
import {
  buildPatternSummary,
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
  handler: async (ctx, args) => {
    try {
      // 1. Load full context (includes turns + current mirror)
      const context = await ctx.runQuery(
        internal.ai.context.buildSessionContext,
        { sessionId: args.sessionId },
      );

      const session = context.session as {
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
      const mirrorTone = context.preferences?.mirrorTone ?? "adaptive";
      const patternSummary = buildPatternSummary({
        profile: context.profile,
        recentMetadata: context.recentMetadata,
        recentSessions: context.recentSessions,
        isFirstSession: context.isFirstSession,
        mirrorTone,
      });

      const recentMirrors = collectRecentMirrors(context.recentSessions);

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
        toneUsed: mirrorTone as
          | "poetic"
          | "gentle"
          | "direct"
          | "adaptive"
          | "witnessed",
      });
      await posthog.capture(ctx, {
        distinctId: session.emotionalProfileId,
        event: "clarify_delivered",
        properties: {
          turnNumber: args.turnNumber,
          hadAdditionalText: !!args.additionalRawText,
          usedFallback: revisedMirrorText === FALLBACK_MIRROR,
          userFeedback: userFeedback ?? "not_quite",
        },
      });

      // 7.5. Replace TTS: delete old audio file and schedule fresh generation.
      const oldStorageId = await ctx.runQuery(
        internal.sessions.getMirrorAudioStorageId,
        { sessionId: args.sessionId },
      );
      if (oldStorageId) {
        await ctx.storage.delete(oldStorageId);
        await ctx.runMutation(internal.sessions.clearMirrorAudio, {
          sessionId: args.sessionId,
        });
      }
      if (revisedMirrorText !== FALLBACK_MIRROR) {
        await ctx.scheduler.runAfter(0, internal.ai.tts.generateMirrorAudio, {
          sessionId: args.sessionId,
          mirrorText: revisedMirrorText,
          mirrorTone: mirrorTone as
            | "poetic"
            | "gentle"
            | "direct"
            | "adaptive"
            | "witnessed",
        });
      }
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
        distinctId: args.sessionId as string,
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
