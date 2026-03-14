"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Anonymize a session's mirror text into a pool reflection.
 * Called after session completion when user chose to contribute.
 *
 * TODO Phase 3b: Use AI to distill the mirror into an anonymized
 * reflection that captures emotional essence without identifying details.
 * For now, uses the mirror text directly (which is already AI-generated
 * and should not contain identifying information).
 */
export const anonymize = internalAction({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    // Load session and metadata
    const context = await ctx.runQuery(
      internal.ai.context.buildSessionContext,
      { sessionId: args.sessionId }
    );

    const session = context.session;
    if (!session.mirrorText) {
      return;
    }

    // Load emotional metadata for classification data
    const metadata = context.recentMetadata[0]; // Most recent = this session's
    if (!metadata) {
      return;
    }

    // TODO: Use AI to distill mirror text into anonymized reflection
    // For now, use mirror text directly
    const displayText = session.mirrorText;

    await ctx.runMutation(internal.reflections.contribute, {
      displayText,
      primaryEmotion: metadata.primaryEmotion,
      granularLabel: metadata.granularLabel,
      thematicTags: metadata.thematicTags,
      intensity: metadata.intensity,
    });
  },
});
