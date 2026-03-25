import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Contribute a session's distilled reflection into the anonymous pool.
 * Called after session completion when user chose to contribute.
 *
 * Uses the pre-generated distilledText (voice-preserving, first-person).
 * Falls back to mirrorText if distillation wasn't generated or returned NULL.
 */
export const anonymize = internalAction({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(
      internal.ai.context.buildSessionContext,
      { sessionId: args.sessionId }
    );

    const session = context.session as {
      distilledText?: string;
      mirrorText?: string;
      [key: string]: unknown;
    };

    // Prefer distilled text (first-person, voice-preserving)
    // Fall back to mirror text (second-person, AI voice)
    const displayText = session.distilledText ?? session.mirrorText;
    if (!displayText) {
      return;
    }

    const metadata = context.recentMetadata[0];
    if (!metadata) {
      return;
    }

    await ctx.runMutation(internal.reflections.contribute, {
      displayText,
      primaryEmotion: metadata.primaryEmotion,
      granularLabel: metadata.granularLabel,
      thematicTags: metadata.thematicTags,
      intensity: metadata.intensity,
    });
  },
});
