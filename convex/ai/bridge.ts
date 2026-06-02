import { v } from "convex/values";
import { action, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getAnthropicClient,
  ARTICULATOR_MODEL,
  extractTextFromResponse,
} from "./providers/anthropic";
import { requireSessionOwnership } from "../lib/auth";

export const verifyOwnership = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);
    return { mirrorText: session.mirrorText ?? null };
  },
});

async function _generateDraft(
  mirrorText: string,
  recipientName: string,
  recipientRelationship?: string,
): Promise<string> {
  const client = getAnthropicClient();
  const relationshipHint = recipientRelationship
    ? ` They are your ${recipientRelationship}.`
    : "";

  const prompt = `You are helping someone reach out to a person they care about after an emotional processing session.

The person processed this feeling:
"${mirrorText}"

They want to share something with ${recipientName}.${relationshipHint}

Write a short, warm message (3-5 sentences) they could send. Write it in first-person, as if the user is speaking directly to ${recipientName}. The message should:
- Feel personal and human, not clinical
- Reference the feeling without quoting the session word-for-word
- Open a door for connection — not demand a response
- Sound like something a real person would actually send

Write only the message, nothing else.`;

  const response = await client.messages.create({
    model: ARTICULATOR_MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return extractTextFromResponse(response).trim();
}

export const requestBridgeDraft = action({
  args: {
    sessionId: v.id("sessions"),
    recipientName: v.string(),
    recipientRelationship: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { mirrorText } = (await ctx.runQuery(
      internal.ai.bridge.verifyOwnership,
      { sessionId: args.sessionId },
    )) as { mirrorText: string | null };

    if (!mirrorText) {
      throw new Error("No mirror text for this session");
    }

    const draft = await _generateDraft(
      mirrorText,
      args.recipientName.trim(),
      args.recipientRelationship,
    );

    return { draft };
  },
});
