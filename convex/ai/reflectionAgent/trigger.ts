import { v } from "convex/values";
import { internalAction, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { rateLimiter } from "../../lib/rateLimits";
import { posthog } from "../../posthog";
import { renderSemanticProfile } from "../../semanticProfiles";
import {
  getAnthropicClient,
  extractTextFromResponse,
  REFLECTION_LIGHT_MODEL,
  REFLECTION_LIGHT_VERSION,
} from "../providers/anthropic";
import {
  buildLightPassPrompt,
  parseLightPassResponse,
  type LightPassContext,
  type LightPassMetadataRow,
} from "../prompts/reflectionLight";
import { workflow } from "./consolidation";

// =============================================================
// Reflection Agent — ORCHESTRATOR / TRIGGER (Cognition Layer Phase 3).
//
// Scheduled off the critical path from sessions.completePath /
// completeSession (a sibling of profileStats.updateAfterSession). Runs the
// post-session LIGHT PASS (single Haiku call, refreshes trajectory), then
// checks the activity gate and, if due, starts the durable CONSOLIDATION
// workflow. Every step is best-effort — this is background work and must
// never throw into a completion path or block a live mirror.
//
// No "use node": the Anthropic SDK is fetch-based (same as followUps.ts).
// =============================================================

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LIGHT_MAX_TOKENS = 256;
const RECENCY_WINDOW = 8;

/** Map a stored metadata row to the prompt's recency shape. */
function toMetadataRow(m: {
  primaryEmotion: string;
  granularLabel?: string;
  intensity: number;
  thematicTags: string[];
  userLanguageTags: string[];
  temporalContext?: string;
  createdAt: number;
}): LightPassMetadataRow {
  return {
    primaryEmotion: m.primaryEmotion,
    granularLabel: m.granularLabel,
    intensity: m.intensity,
    thematicTags: m.thematicTags,
    userLanguageTags: m.userLanguageTags,
    temporalContext: m.temporalContext,
    createdAt: m.createdAt,
  };
}

/**
 * Everything the light pass reads: the just-completed session's Understanding,
 * the current rendered profile (for continuity), and a short recency window.
 */
export const getLightPassContext = internalQuery({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args): Promise<LightPassContext> => {
    const justMeta = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    const profile = await ctx.db.get(args.emotionalProfileId);
    const currentDoc = profile?.currentSemanticProfileId
      ? await ctx.db.get(profile.currentSemanticProfileId)
      : null;

    const recent = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_theme", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId),
      )
      .order("desc")
      .take(RECENCY_WINDOW);

    return {
      justCompleted: justMeta ? toMetadataRow(justMeta) : null,
      currentProfile: currentDoc ? renderSemanticProfile(currentDoc) : null,
      // Drop the just-completed row from the recency window (it's shown above).
      recentMetadata: recent
        .filter((m) => m.sessionId !== args.sessionId)
        .map(toMetadataRow),
    };
  },
});

/**
 * The activity gate (doc §3, decision-log #7). Due when, since the last
 * consolidation anchor, the user has >= 5 completed sessions OR >= 7 days have
 * elapsed with >= 1 completed session. Anchor falls back to firstSessionAt,
 * then createdAt, when no consolidation has run yet.
 */
export const getConsolidationGate = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args): Promise<{ due: boolean }> => {
    const profile = await ctx.db.get(args.emotionalProfileId);
    if (!profile) return { due: false };

    const anchor =
      profile.lastConsolidationAt ??
      profile.firstSessionAt ??
      profile.createdAt;

    // Bounded: the six newest completed sessions is enough to decide >= 5.
    const completed = await ctx.db
      .query("sessions")
      .withIndex("by_profile_state", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId).eq("state", "completed"),
      )
      .order("desc")
      .take(6);

    const count = completed.filter((s) => s.createdAt > anchor).length;
    const due =
      count >= 5 || (Date.now() - anchor >= SEVEN_DAYS_MS && count >= 1);
    return { due };
  },
});

/**
 * Entry point scheduled from the completion mutations. Light pass first, then
 * conditional consolidation. Both wrapped so a failure in one never blocks the
 * other and nothing ever throws back into the scheduler.
 */
export const onSessionComplete = internalAction({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const key = args.emotionalProfileId;

    // ── Light pass: refresh the trajectory line ──────────────────
    try {
      const { ok } = await rateLimiter.limit(ctx, "reflectionLightPass", { key });
      if (ok) {
        const lightCtx = await ctx.runQuery(
          internal.ai.reflectionAgent.trigger.getLightPassContext,
          { emotionalProfileId: args.emotionalProfileId, sessionId: args.sessionId },
        );
        const prompt = buildLightPassPrompt(lightCtx);
        const anthropic = getAnthropicClient();
        const response = await anthropic.messages.create({
          model: REFLECTION_LIGHT_MODEL,
          max_tokens: LIGHT_MAX_TOKENS,
          system: prompt.system,
          messages: [{ role: "user", content: prompt.user }],
        });
        const parsed = parseLightPassResponse(extractTextFromResponse(response));
        if (parsed) {
          await ctx.runMutation(internal.semanticProfiles.updateTrajectory, {
            emotionalProfileId: args.emotionalProfileId,
            trajectory: parsed.trajectory,
            writerVersion: REFLECTION_LIGHT_VERSION,
          });
          await posthog.capture(ctx, {
            distinctId: args.emotionalProfileId,
            event: "reflect_light_pass",
            properties: { writerVersion: REFLECTION_LIGHT_VERSION },
          });
        }
      }
    } catch (err) {
      console.error("[reflectionAgent] light pass failed", {
        message: err instanceof Error ? err.message : String(err),
        sessionId: args.sessionId,
      });
    }

    // ── Consolidation gate: maybe start the deep pass ────────────
    try {
      const { due } = await ctx.runQuery(
        internal.ai.reflectionAgent.trigger.getConsolidationGate,
        { emotionalProfileId: args.emotionalProfileId },
      );
      if (!due) return;

      const { ok } = await rateLimiter.limit(ctx, "reflectionConsolidation", {
        key,
      });
      if (!ok) return; // per-user token budget spent for today

      await workflow.start(
        ctx,
        internal.ai.reflectionAgent.consolidation.consolidationWorkflow,
        { emotionalProfileId: args.emotionalProfileId },
        {
          onComplete:
            internal.ai.reflectionAgent.consolidation.onConsolidationComplete,
          context: {},
        },
      );
    } catch (err) {
      console.error("[reflectionAgent] consolidation trigger failed", {
        message: err instanceof Error ? err.message : String(err),
        emotionalProfileId: args.emotionalProfileId,
      });
    }
  },
});
