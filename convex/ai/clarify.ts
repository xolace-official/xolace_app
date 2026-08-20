"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getAnthropicClient,
  extractTextFromResponse,
  ARTICULATOR_MODEL,
  ARTICULATOR_VERSION,
  CLASSIFIER_VERSION,
} from "./providers/anthropic";
import { classifierCache } from "./cached";
import { buildArticulatorPrompt, hasMetaNarration } from "./prompts/articulator";
import { buildClassifierPrompt } from "./prompts/classifier";
import {
  buildAccumulatedInput,
  type RefinementTurn,
} from "./prompts/accumulatedInput";
import {
  searchEpisodicMemory,
  type EpisodicSearch,
} from "./helpers/episodicSearch";
import { applyAudioFence } from "./prompts/mirrorAudioTags";
import { resolveMirrorTone } from "./mirrorPlan";
import { scheduleMirrorAudio } from "./tts";
import { routeClaimStrength } from "./routing";
import { MAX_TURNS } from "../sessionTurns";
import {
  buildArticulatorPatternSummary,
  buildPatternSummary,
  collectRecentMirrors,
} from "./helpers/patternSummary";
import { posthog } from "../posthog";

const FALLBACK_MIRROR =
  "I hear you more clearly now. What you're feeling deserves to be seen.";

/**
 * Handle clarification for refinement turns ("Not quite" / "Say more").
 *
 * A refinement builds on what came before (docs/confidence-aware-mirroring.md
 * §5): classifier and articulator both read the original input plus every
 * turn's added words, turn-marked; episodic memory is searched again against
 * that accumulated input; and the Understanding row is replaced with the
 * final read.
 *
 * KNOWN GAP: moderation and safeguard stay off this path — they ran on the
 * initial pass only — so text added on a refinement turn now drives the stored
 * classification while `riskFlag` / `safeguardLevel` keep the verdict derived
 * from the original words. That is why the metadata write goes through a
 * mutation that cannot express a safety field rather than through `store`:
 * clarify has no safety verdict to write. Re-running safeguard on the
 * accumulated input (and the escalation path that implies) is its own ticket.
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
      escalationTriggered?: boolean;
      gapNamed?: boolean;
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
        classifierVersion: string;
        primaryEmotion: string;
        primaryEmotionConfidence: number;
        granularLabel?: string;
        secondaryEmotion?: string;
        intensity: number;
        specificity: number;
        thematicTags: string[];
        userLanguageTags: string[];
        temporalContext?: "past_focused" | "present_focused" | "future_focused";
        episodicMatchKeys?: string[];
        episodicTopScore?: number;
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

      // 3. This turn's feedback, and the turn-marked accumulated input both
      // prompts read (§5.1). The turn rows carry every earlier addition; the
      // action's own argument is the authority for this turn, since the row
      // may predate the client that started writing `userInput`.
      const turns = (context.turns as unknown as RefinementTurn[]).map((t) =>
        t.turnNumber === args.turnNumber && !t.userInput
          ? { ...t, userInput: args.additionalRawText }
          : t,
      );
      const currentTurn = turns.find((t) => t.turnNumber === args.turnNumber);
      const userFeedback = currentTurn?.userFeedback;
      const addedText = (currentTurn?.userInput ?? "").trim();

      const accumulatedInput = buildAccumulatedInput(
        (session.rawInput as string | undefined) ?? "",
        turns,
      );

      // Real fence: same downgrade guard as the initial mirror (process.ts).
      const mirrorTone = resolveMirrorTone(
        context.preferences?.mirrorTone,
        context.isPremium,
      );

      // 4. Re-classify against the accumulated input, and re-search episodic
      // memory (§5.2) — the detail that arrives on turn 2 may be exactly what
      // makes Tuesday relevant, and a frozen turn-1 "didn't connect" would
      // leave the reach permanently unearned. This does not re-open the reach:
      // one reach only still holds, via gapNamedThisSession below.
      //
      // Zero added text skips the classifier entirely: identical input, same
      // answer, and re-deriving what the Understanding already knows is not
      // licensed. `userFeedback` deliberately never reaches the classifier —
      // telling a precise analytical instrument that its last answer was
      // rejected invites it off a correct classification to please the user.
      const classifierPrompt =
        addedText.length > 0
          ? buildClassifierPrompt(
              accumulatedInput,
              buildPatternSummary({
                profile: context.profile,
                recentMetadata: context.recentMetadata,
                recentSessions: context.recentSessions,
                isFirstSession: context.isFirstSession,
                mirrorTone,
              }),
              context.isFirstSession,
              session.entryType ?? "open_prompt",
              session.timeOfDay as string | undefined,
            )
          : null;

      const [reclassified, episodic] = await Promise.all([
        classifierPrompt
          ? classifierCache
              .fetch(ctx, {
                systemPrompt: classifierPrompt.system,
                userPrompt: classifierPrompt.user,
              })
              // A classifier blip must not cost a mirror that already exists —
              // fall back to the classification the session already has.
              .catch(() => null)
          : Promise.resolve(null),
        context.isFirstSession
          ? Promise.resolve({ matches: [] } as EpisodicSearch)
          : searchEpisodicMemory(
              ctx,
              session.emotionalProfileId,
              args.sessionId,
              accumulatedInput,
            ),
      ]);

      const classification = reclassified ?? {
        primaryEmotion: metadata.primaryEmotion,
        primaryEmotionConfidence: metadata.primaryEmotionConfidence,
        granularLabel: metadata.granularLabel,
        secondaryEmotion: metadata.secondaryEmotion,
        intensity: metadata.intensity,
        specificity: metadata.specificity,
        thematicTags: metadata.thematicTags,
        userLanguageTags: metadata.userLanguageTags,
        temporalContext: metadata.temporalContext,
        requiresFollowUp: false,
        followUpReason: undefined,
      };

      // 5. Build the articulator prompt with refinement context.
      // Clarify only re-articulates, so it uses the slim articulator variant.
      const patternSummary = buildArticulatorPatternSummary({
        recentMetadata: context.recentMetadata,
        isFirstSession: context.isFirstSession,
      });

      const recentMirrors = collectRecentMirrors(context.recentSessions);

      // Claim strength on the refinement pass — the same single gate as the
      // initial mirror, with the full context it needs. The suppression guards
      // are re-evaluated here rather than assumed: relying on the client not
      // rendering "Say more" on an escalation screen would prop up a
      // server-side safety rule with a client-side fact.
      // A search that never ran says nothing about whether memory connected,
      // so the score the mirror was already built on stands — otherwise an
      // embedding outage would silently turn a connected session into a reach.
      const episodicTopScore = episodic.failed
        ? metadata.episodicTopScore
        : episodic.topScore;

      // The claim strength of the mirror the user pressed on (§9.4). Same
      // inputs `deriveClaimStrength` served to the action row before this
      // turn, so the property joins to the press event's `claimStrength`
      // rather than to a second, differently-derived number.
      const respondingToClaimStrength = routeClaimStrength({
        confidence: metadata.primaryEmotionConfidence,
        specificity: metadata.specificity,
        episodicTopScore: metadata.episodicTopScore,
        entryType: session.entryType ?? "open_prompt",
        isEscalation: session.escalationTriggered === true,
        profileReachedToday: context.profileReachedToday,
        gapNamedThisSession: session.gapNamed === true,
        atCap: args.turnNumber - 1 >= MAX_TURNS,
        userFeedback: turns.find((t) => t.turnNumber === args.turnNumber - 1)
          ?.userFeedback,
      });

      const claimStrength = routeClaimStrength({
        confidence: classification.primaryEmotionConfidence,
        specificity: classification.specificity,
        episodicTopScore,
        entryType: session.entryType ?? "open_prompt",
        isEscalation: session.escalationTriggered === true,
        profileReachedToday: context.profileReachedToday,
        gapNamedThisSession: session.gapNamed === true,
        atCap: args.turnNumber >= MAX_TURNS,
        userFeedback,
      });

      const articulatorPrompt = buildArticulatorPrompt({
        rawInput: accumulatedInput,
        classification: {
          ...classification,
          // The follow-up flag is a scheduling decision, not an articulation
          // input.
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
        spaceName: context.preferences?.spaceName,
        // Longitudinal Understanding: pass the semantic profile through so the
        // refinement is grounded in who this person is, matching process.ts.
        semanticProfile: context.semanticProfile,
        episodicRecall: episodic.matches.map((m) => m.text),
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
        if (!revisedMirrorText || hasMetaNarration(revisedMirrorText)) {
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
        // Same fence as the initial mirror: a fallback named no gap.
        ...(claimStrength === "reaching" && !isFallback
          ? { gapNamed: true }
          : {}),
        // Raise-only (§5.3): a re-classification may turn a follow-up on,
        // never off — a session that already scheduled a workflow must not be
        // left holding it against a disagreeing flag.
        ...(reclassified?.requiresFollowUp ? { requiresFollowUp: true } : {}),
      });

      // 7.1. Replace the Understanding with the final read of this moment.
      // Every downstream consumer runs after the session ends and wants the
      // last word, not an audit trail.
      await ctx.runMutation(internal.emotionalMetadata.replaceForRefinement, {
        sessionId: args.sessionId,
        classifierVersion: reclassified
          ? CLASSIFIER_VERSION
          : metadata.classifierVersion,
        primaryEmotion: classification.primaryEmotion,
        primaryEmotionConfidence: classification.primaryEmotionConfidence,
        granularLabel: classification.granularLabel,
        secondaryEmotion: classification.secondaryEmotion,
        intensity: classification.intensity,
        specificity: classification.specificity,
        thematicTags: classification.thematicTags,
        userLanguageTags: classification.userLanguageTags,
        temporalContext: classification.temporalContext,
        // Both episodic fields are replaced together, and only when the search
        // actually ran: an outage returning no matches must not wipe the
        // provenance Loop #3 reads at confirmation. Inside that, topScore is
        // spread rather than `?? 0` — a zero would read as a genuine (terrible)
        // score at calibration.
        ...(episodic.failed
          ? {}
          : {
              episodicMatchKeys: episodic.matches.map((m) => m.key),
              ...(episodic.topScore !== undefined
                ? { episodicTopScore: episodic.topScore }
                : {}),
            }),
        ...(reclassified?.followUpReason
          ? { followUpReason: reclassified.followUpReason }
          : {}),
      });

      await posthog.capture(ctx, {
        distinctId: session.emotionalProfileId,
        event: "clarify_delivered",
        properties: {
          // §9.4: `sessionId` joins the press to this delivery (the primary
          // metric); `reachAlreadySent` separates a holding turn from a first
          // reach; `specificity` is the post-turn read, so the secondary
          // before/after delta is readable without a second event.
          sessionId: args.sessionId,
          entryType: session.entryType ?? "open_prompt",
          isFirstSession: context.isFirstSession,
          specificity: classification.specificity,
          respondingToClaimStrength,
          reachAlreadySent: session.gapNamed === true,
          turnNumber: args.turnNumber,
          hadAdditionalText: addedText.length > 0,
          reclassified: reclassified !== null,
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
