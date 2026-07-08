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
import { stripAudioTags } from "./prompts/mirrorAudioTags";
import { evaluateSafeguard } from "./safeguard";
import { routeUncertainty } from "./routing";
import {
  buildArticulatorPatternSummary,
  buildPatternSummary,
  collectRecentMirrors,
} from "./helpers/patternSummary";

import { rateLimiter, AI_MIRROR_LIMITS_PLUS } from "../lib/rateLimits";
import { posthog } from "../posthog";
import { rag } from "../rag";

import type { SessionContext } from "./context";
import { matchExercise } from "../exercises/match";

const FALLBACK_MIRROR = "I hear you, and what you're feeling matters.";

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
    let session:
      | {
          entryType?: string;
          timeOfDay?: string;
          sessionMode?: "day" | "night";
          emotionalProfileId: string;
          [key: string]: unknown;
        }
      | undefined;
    try {
      // 1. Load full context (single DB transaction)
      const context: SessionContext = await ctx.runQuery(
        internal.ai.context.buildSessionContext,
        { sessionId: args.sessionId },
      );

      // 1a. Rate limit AI requests (main cost control)
      const { ok, retryAfter } = await rateLimiter.limit(
        ctx,
        "aiMirrorRequest",
        {
          key: context.session.emotionalProfileId as string,
          ...(context.isPremium ? { config: AI_MIRROR_LIMITS_PLUS } : {}),
        },
      );

      if (!ok) {
        const minutes = Math.ceil((retryAfter ?? 0) / 60000);
        const retryText =
          minutes > 0
            ? `Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`
            : "Try again in a few minutes.";

        await ctx.runMutation(internal.sessions.failSession, {
          sessionId: args.sessionId,
          errorMessage: `You've reached the limit for reflections. ${retryText}`,
        });
        await posthog.capture(ctx, {
          distinctId: context.session.emotionalProfileId as string,
          event: "mirror_rate_limited",
          properties: { retryAfterMs: retryAfter ?? 0 },
        });
        return;
      }

      // 2. Build pattern summaries (pure functions). The classifier gets
      //    the full variant (its only historical context); the articulator
      //    gets the slim emotion-signal variant — longitudinal identity
      //    reaches it via the semantic profile block instead.
      const rawMirrorTone = context.preferences?.mirrorTone ?? "adaptive";
      // Real fence: a witnessed preference set before a downgrade must not
      // keep granting the premium tone after entitlement lapses.
      const mirrorTone =
        rawMirrorTone === "witnessed" && !context.isPremium
          ? "adaptive"
          : rawMirrorTone;
      const patternSummary = buildPatternSummary({
        profile: context.profile,
        recentMetadata: context.recentMetadata,
        recentSessions: context.recentSessions,
        isFirstSession: context.isFirstSession,
        mirrorTone,
      });
      const articulatorPatternSummary = buildArticulatorPatternSummary({
        recentMetadata: context.recentMetadata,
        isFirstSession: context.isFirstSession,
      });
      console.log("pattern Summary ", patternSummary);

      // 3. Parallel: moderation + classification (both cached)
      const anthropic = getAnthropicClient();

      session = context.session as {
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
        session.timeOfDay,
      );
      console.log("classifier prompt ", classifierPrompt);

      // 4. Fetch moderation + classification + episodic recall in parallel.
      //    Episodic recall (Cognition Layer §1.3): top-K past composites
      //    from the user's personal namespace, matched raw-to-raw against
      //    tonight's input. Best-effort — memory failing must never block
      //    the mirror.
      const [moderationResult, classification, episodicMatches] =
        await Promise.all([
          moderationCache
            .fetch(ctx, { text: args.rawText })
            .catch(() => MODERATION_UNAVAILABLE),
          classifierCache.fetch(ctx, {
            systemPrompt: classifierPrompt.system,
            userPrompt: classifierPrompt.user,
          }),
          context.isFirstSession
            ? Promise.resolve([] as EpisodicMatch[])
            : searchEpisodicMemory(
                ctx,
                session.emotionalProfileId,
                args.sessionId,
                args.rawText,
              ),
        ]);
      const episodicRecall = episodicMatches.map((m) => m.text);

      // 5. Evaluate safeguard (rule engine, no LLM)
      const safeguard = evaluateSafeguard(
        classification,
        moderationResult,
        context.recentMetadata,
      );
      console.log("safeguard ", safeguard);

      // 5a. If content should be rejected, fail the session
      if (safeguard.shouldReject) {
        await ctx.runMutation(internal.sessions.failSession, {
          sessionId: args.sessionId,
          errorMessage: safeguard.rejectionReason ?? "content_policy_violation",
        });
        await posthog.capture(ctx, {
          distinctId: session.emotionalProfileId,
          event: "mirror_content_rejected",
          properties: {
            rejectionReason: safeguard.rejectionReason ?? "content_policy_violation",
          },
        });
        return;
      }

      // 6. Articulate mirror (Sonnet)
      const recentMirrors = collectRecentMirrors(context.recentSessions);

      // 6a. Uncertainty routing (Phase 4, Loop #2). Deterministic rule-code —
      //     the hot path never gets agentic (decision-log #8). Gates the
      //     mirror's claim strength off how sure the classifier is about
      //     tonight's read; the prompt composes it with the profile's
      //     longitudinal calibration.
      const claimStrength = routeUncertainty({
        confidence: classification.primaryEmotionConfidence,
        specificity: classification.specificity,
      });

      let mirrorText: string;
      try {
        const articulatorPrompt = buildArticulatorPrompt({
          rawInput: args.rawText,
          classification,
          patternSummary: articulatorPatternSummary,
          safeguardLevel: safeguard.level,
          mirrorTone,
          isFirstSession: context.isFirstSession,
          recentMirrors,
          entryType: session.entryType ?? "open_prompt",
          inputDuration: context.session.inputDuration as number | undefined,
          freezeOccurred: context.session.freezeOccurred as boolean | undefined,
          sessionMode: session.sessionMode,
          spaceName: context.preferences?.spaceName,
          semanticProfile: context.semanticProfile,
          episodicRecall,
          claimStrength,
          useAudioTags: context.isPremium,
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

      // Xolace+ audio tags (when applied) live only in the TTS input — the
      // stored/displayed mirror, recentMirrors, and pattern context all read
      // the stripped text so a tag never leaks into anything but speech.
      const ttsMirrorText = mirrorText;
      if (context.isPremium && mirrorText !== FALLBACK_MIRROR) {
        mirrorText = stripAudioTags(mirrorText);
      }

      // 7. Deliver mirror (include escalation flag atomically so the
      //    client sees both state and escalationTriggered in one update)
      const isEscalation =
        (safeguard.level === "crisis" || safeguard.level === "elevated") &&
        !!safeguard.triggerType;

      // Preliminary follow-up flag (the gave_up rule is folded in later, at
      // session completion — confirmationState isn't known yet here).
      const requiresFollowUp =
        isEscalation || classification.requiresFollowUp === true;

      await ctx.runMutation(internal.sessions.deliverMirror, {
        sessionId: args.sessionId,
        mirrorText,
        mirrorModelVersion: ARTICULATOR_VERSION,
        toneUsed: mirrorTone as
          | "poetic"
          | "gentle"
          | "direct"
          | "adaptive"
          | "witnessed",
        safeguardLevel: safeguard.level,
        ...(isEscalation
          ? {
              escalationTriggered: true,
              escalationResources: safeguard.resourcesPresented,
            }
          : {}),
        ...(requiresFollowUp ? { requiresFollowUp: true } : {}),
      });
      await posthog.capture(ctx, {
        distinctId: session.emotionalProfileId,
        event: "mirror_delivered",
        properties: {
          entryType: session.entryType ?? "open_prompt",
          toneUsed: mirrorTone,
          claimStrength,
          safeguardLevel: safeguard.level,
          escalationTriggered: isEscalation,
          usedFallback: mirrorText === FALLBACK_MIRROR,
          isFirstSession: context.isFirstSession,
          sessionMode: session.sessionMode ?? "day",
        },
      });

      // 7.5. Schedule TTS generation (fire-and-forget, non-blocking)
      //      Skipped for fallback mirrors — nothing meaningful to speak.
      if (mirrorText !== FALLBACK_MIRROR) {
        await ctx.scheduler.runAfter(0, internal.ai.tts.generateMirrorAudio, {
          sessionId: args.sessionId,
          mirrorText: ttsMirrorText,
          mirrorTone: mirrorTone as
            | "poetic"
            | "gentle"
            | "direct"
            | "adaptive"
            | "witnessed",
        });
      }

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
        // Understanding completion (Cognition Layer Phase 2): the full
        // verdict about this moment lives in one row — safeguard result,
        // which memories informed the mirror, which profile version was
        // in context.
        safeguardLevel: safeguard.level,
        ...(safeguard.triggerType
          ? { safeguardTrigger: safeguard.triggerType }
          : {}),
        episodicMatchKeys: episodicMatches.map((m) => m.key),
        ...(context.semanticProfileVersion !== null
          ? { profileVersion: context.semanticProfileVersion }
          : {}),
        ...(classification.followUpReason
          ? { followUpReason: classification.followUpReason }
          : {}),
      });

      // 8.5. Match exercise from emotional classification.
      //      Confidence < 0.6 = ambiguous input → safe fallback to "reset".
      const rankedTitles = matchExercise({
        primaryEmotion: classification.primaryEmotion,
        granularLabel: classification.granularLabel,
        intensity: classification.intensity,
        userLanguageTags: classification.userLanguageTags,
        entryType: session.entryType ?? "open_prompt",
        confirmationState: "confirmed",
      });
      const primaryTitle =
        classification.primaryEmotionConfidence < 0.6
          ? "reset"
          : rankedTitles[0];
      const matched = await ctx.runQuery(internal.exercises.getByTitle, {
        title: primaryTitle,
      });
      if (matched) {
        await ctx.runMutation(internal.exercises.setMatched, {
          sessionId: args.sessionId,
          matchedExerciseId: matched._id,
        });

        // 8.7: Slot-fill — fire-and-forget so it doesn't block mirror delivery.
        const slotKeys = [
          ...new Set(
            matched.steps.flatMap(
              (s: { slotKeys?: string[] }) => s.slotKeys ?? [],
            ),
          ),
        ];
        if (slotKeys.length > 0) {
          await ctx.scheduler.runAfter(0, internal.ai.slotFill.fillSlots, {
            sessionId: args.sessionId,
            exerciseTitle: primaryTitle,
            slotKeys,
            mirrorText,
            userLanguageTags: classification.userLanguageTags,
            primaryEmotion: classification.primaryEmotion,
          });
        }
      }

      // 9. Schedule speculative distillation (for reflection pool)
      //    Skip if mirror is the fallback — nothing meaningful to distill.
      //    Skip entirely for crisis sessions
      const isCrisis = safeguard.level === "crisis";
      if (mirrorText !== FALLBACK_MIRROR && !isCrisis) {
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
          },
        );
      }

      // 9.5. Schedule episodic memory ingestion (Cognition Layer §1.1).
      //      Keyed by sessionId → idempotent replace. Delayed slightly so
      //      the speculative distiller has usually written distilledText
      //      by the time the composite is built. ingestSession itself
      //      handles crisis (metadata-only) and the personal-memory toggle.
      await ctx.scheduler.runAfter(
        30_000,
        internal.episodicMemory.ingestSession,
        { sessionId: args.sessionId },
      );

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
          ? sanitizeAiError(error)
          : "Something interrupted this moment. You can try again when you're ready.";

      await ctx.runMutation(internal.sessions.failSession, {
        sessionId: args.sessionId,
        errorMessage,
      });
      await posthog.capture(ctx, {
        distinctId: session?.emotionalProfileId ?? (args.sessionId as string),
        event: "mirror_generation_failed",
        properties: { errorType: classifyAiError(error) },
      });
    }
  },
});

/**
 * One episodic memory that informed a mirror: composite text for the
 * articulator, RAG key (= sessionId) for Understanding provenance.
 */
type EpisodicMatch = { text: string; key: string };

/**
 * Top-K episodic matches for the current input from the user's personal
 * namespace (Cognition Layer §1.3). Returns composite texts, newest-format
 * or metadata-only alike. Best-effort: any failure (no namespace yet,
 * embedding outage) returns [] so memory can never block the mirror.
 */
async function searchEpisodicMemory(
  ctx: Parameters<typeof rag.search>[0],
  emotionalProfileId: string,
  currentSessionId: string,
  rawText: string,
): Promise<EpisodicMatch[]> {
  try {
    const { entries } = await rag.search(ctx, {
      namespace: emotionalProfileId,
      query: rawText,
      limit: 4,
    });
    return entries
      .filter((e) => e.key !== undefined && e.key !== currentSessionId)
      .slice(0, 3)
      .map((e) => ({ text: e.text, key: e.key as string }));
  } catch {
    return [];
  }
}

function sanitizeAiError(error: Error): string {
  const msg = error.message;
  if (msg.includes("overloaded_error") || msg.startsWith("529")) {
    return "The space is a little full right now. Take a breath and try again in a moment.";
  }
  if (msg.includes("rate_limit") || msg.startsWith("429")) {
    return "The space is a little full right now. Take a breath and try again in a moment.";
  }
  return "Something interrupted this moment. You can try again when you're ready.";
}

function classifyAiError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const msg = error.message;
  if (msg.includes("overloaded_error") || msg.startsWith("529")) return "anthropic_overloaded";
  if (msg.includes("rate_limit") || msg.startsWith("429")) return "anthropic_rate_limit";
  if (msg.includes("context") || msg.startsWith("buildSessionContext")) return "context_load_failed";
  return "unknown";
}
