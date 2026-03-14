"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Main AI orchestrator for mirror generation.
 *
 * Phase 3a: Classify via Haiku + deliver stub mirror
 * Phase 3b: Add Sonnet articulation for real mirrors
 *
 * All AI calls (classify, safeguard, articulate) are plain async
 * functions called within this action — NOT separate registered actions.
 */
export const generateMirror = internalAction({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    try {
      // Load full context
      const context = await ctx.runQuery(
        internal.ai.context.buildSessionContext,
        { sessionId: args.sessionId }
      );

      // TODO Phase 3a: Replace with real Haiku classification
      // const classification = await classifyEmotion(context);
      // const safeguardResult = await checkSafeguard(context);

      // TODO Phase 3a: Store emotional_metadata
      // await ctx.runMutation(internal.emotionalMetadata.store, { ... });

      // TODO Phase 3a: If escalation detected, create event
      // if (safeguardResult.isRisk) {
      //   await ctx.runMutation(internal.escalation.create, { ... });
      // }

      // TODO Phase 3b: Replace with real Sonnet articulation
      // const mirrorText = await articulateMirror(context, classification);

      // For now, deliver a stub mirror
      const mirrorText =
        "I hear you. It sounds like something is weighing on you right now, and that's okay.";

      await ctx.runMutation(internal.sessions.deliverMirror, {
        sessionId: args.sessionId,
        mirrorText,
        mirrorModelVersion: "stub-v1",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error during AI processing";

      await ctx.runMutation(internal.sessions.failSession, {
        sessionId: args.sessionId,
        errorMessage,
      });
    }
  },
});
