"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import {
  getAnthropicClient,
  extractTextFromResponse,
  parseClassificationResponse,
  CLASSIFIER_MODEL,
  DISTILLER_MODEL,
} from "./providers/anthropic";
import {
  MODERATION_UNAVAILABLE,
  EMPTY_CATEGORIES,
  type ModerationResult,
} from "./providers/moderation";
import type { ClassificationResult } from "./providers/anthropic";

export const moderationAction = internalAction({
  args: { text: v.string() },
  handler: async (_ctx, args): Promise<ModerationResult> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return MODERATION_UNAVAILABLE;
    }
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: "omni-moderation-latest", input: args.text }),
      });
      if (!response.ok) return MODERATION_UNAVAILABLE;
      const data = await response.json();
      const result = data.results?.[0];
      if (!result) return MODERATION_UNAVAILABLE;
      return {
        flagged: result.flagged ?? false,
        categories: { ...EMPTY_CATEGORIES, ...result.categories },
        categoryScores: result.category_scores ?? {},
      };
    } catch {
      return MODERATION_UNAVAILABLE;
    }
  },
});

export const classifierAction = internalAction({
  args: { systemPrompt: v.string(), userPrompt: v.string() },
  handler: async (_ctx, args): Promise<ClassificationResult> => {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 512,
      system: args.systemPrompt,
      messages: [{ role: "user", content: args.userPrompt }],
    });
    const raw = extractTextFromResponse(response);
    try {
      return parseClassificationResponse(raw);
    } catch {
      // Retry once with stricter instruction
      const retryResponse = await anthropic.messages.create({
        model: CLASSIFIER_MODEL,
        max_tokens: 512,
        system: args.systemPrompt,
        messages: [
          { role: "user", content: args.userPrompt },
          { role: "assistant", content: raw },
          {
            role: "user",
            content:
              "Your response was not valid JSON. Respond with ONLY a valid JSON object, no other text.",
          },
        ],
      });
      const retryRaw = extractTextFromResponse(retryResponse);
      try {
        return parseClassificationResponse(retryRaw);
      } catch {
        throw new Error(
          `Classification retry failed: model returned non-JSON after two attempts. Raw retry response: ${retryRaw}`
        );
      }
    }
  },
});

export const distillerAction = internalAction({
  args: { systemPrompt: v.string(), userPrompt: v.string() },
  handler: async (_ctx, args): Promise<string> => {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: DISTILLER_MODEL,
      max_tokens: 200,
      system: args.systemPrompt,
      messages: [{ role: "user", content: args.userPrompt }],
    });
    return extractTextFromResponse(response).trim();
  },
});
