"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getAnthropicClient,
  extractTextFromResponse,
} from "./providers/anthropic";

const SLOT_FILL_MODEL = "claude-haiku-4-5-20251001";

/**
 * Fill exercise slot values for a session.
 *
 * Deterministic slots (mirror_line, user_emotion) are resolved directly.
 * user_phrase is extracted via a single Haiku call.
 * Any failure swallows silently — beats fall back to defaultContent.
 */
export const fillSlots = internalAction({
  args: {
    sessionId: v.id("sessions"),
    exerciseTitle: v.string(),
    slotKeys: v.array(v.string()),
    mirrorText: v.string(),
    userLanguageTags: v.array(v.string()),
    primaryEmotion: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.slotKeys.length === 0) return;

    const slots: Record<string, string> = {};

    // Fill deterministic slots without LLM
    for (const key of args.slotKeys) {
      if (key === "mirror_line") {
        slots[key] = args.mirrorText;
      } else if (key === "user_emotion") {
        slots[key] = args.primaryEmotion;
      }
    }

    const llmKeys = args.slotKeys.filter((k) => k === "user_phrase");

    if (llmKeys.length > 0) {
      try {
        const anthropic = getAnthropicClient();

        const langContext =
          args.userLanguageTags.length > 0
            ? args.userLanguageTags.join(", ")
            : args.primaryEmotion;

        const userPrompt = `Mirror text: "${args.mirrorText}"
Primary emotion: ${args.primaryEmotion}
User's own words: ${langContext}

Extract a slot value as a JSON object. The value must be 10 words or fewer, lowercase, no trailing punctuation. Return null if you cannot fill it authentically from the context above.

Slot to fill:
- user_phrase: A 2–6 word phrase in the user's own language that names what they feel. Prefer exact words from "User's own words" above.

Respond with only a JSON object, for example: {"user_phrase": "stuck and can't move"}`;

        const response = await anthropic.messages.create({
          model: SLOT_FILL_MODEL,
          max_tokens: 150,
          system:
            "You extract concise phrases to personalize emotional processing exercises. Return only valid JSON.",
          messages: [{ role: "user", content: userPrompt }],
        });

        const raw = extractTextFromResponse(response).trim();
        const cleaned = raw
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        const parsed = JSON.parse(cleaned);

        for (const key of llmKeys) {
          const val = parsed[key];
          if (
            typeof val === "string" &&
            val.trim() &&
            val.split(/\s+/).length <= 10
          ) {
            slots[key] = val.trim();
          }
        }
      } catch {
        // Haiku failed — user_phrase will fall back to defaultContent in the runner
      }
    }

    if (Object.keys(slots).length > 0) {
      await ctx.runMutation(internal.sessions.writeExerciseSlots, {
        sessionId: args.sessionId,
        slots,
      });
    }
  },
});
