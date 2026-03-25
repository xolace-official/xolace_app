"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getAnthropicClient,
  extractTextFromResponse,
  DISTILLER_MODEL,
} from "../ai/providers/anthropic";
import { buildDistillerPrompt } from "../ai/prompts/distiller";

/**
 * Speculatively distill a session's raw input into an anonymous,
 * voice-preserving first-person reflection.
 *
 * Scheduled immediately after mirror delivery. The result is stored
 * on the session so it's ready when the user reaches the contribution
 * prompt. If the user never contributes, the distillation is unused.
 */
export const distill = internalAction({
  args: {
    sessionId: v.id("sessions"),
    rawText: v.string(),
    mirrorText: v.string(),
    primaryEmotion: v.string(),
    granularLabel: v.optional(v.string()),
    intensity: v.number(),
    thematicTags: v.array(v.string()),
    userLanguageTags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const anthropic = getAnthropicClient();

      const prompt = buildDistillerPrompt({
        rawInput: args.rawText,
        mirrorText: args.mirrorText,
        primaryEmotion: args.primaryEmotion,
        granularLabel: args.granularLabel,
        intensity: args.intensity,
        thematicTags: args.thematicTags,
        userLanguageTags: args.userLanguageTags,
      });

      const response = await anthropic.messages.create({
        model: DISTILLER_MODEL,
        max_tokens: 200,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      });

      const result = extractTextFromResponse(response).trim();

      // Model returned NULL — input not suitable for the pool
      if (!result || result === "NULL") {
        return;
      }

      await ctx.runMutation(internal.sessions.storeDistilledText, {
        sessionId: args.sessionId,
        distilledText: result,
      });
    } catch (error) {
      // Distillation is speculative — failures are non-critical.
      // The anonymizer will fall back to mirror text if no distilledText exists.
      console.error("Distillation failed:", error);
    }
  },
});
