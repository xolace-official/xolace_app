import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalAction, internalMutation, internalQuery } from "../../_generated/server";
import { flagStreamMessage, sendStreamSystemMessage } from "../../integrations/stream";
import {
  chatModerationCategoryValidator,
  conversationRoleValidator,
  safeguardLevelValidator,
} from "../../lib/validators";
import { extractTextFromResponse, getAnthropicClient } from "../providers/anthropic";
import { CRISIS_RESOURCES, SUPPORT_RESOURCES, type Resource, type SafeguardLevel } from "../safeguard";
import {
  buildChatModerationPrompt,
  CHAT_MODERATION_MODEL,
  CHAT_MODERATION_VERSION,
  parseChatModerationResponse,
} from "./classify";

/** The custom `kind` the client's `MessageSystem` override renders as a card. */
export const CRISIS_RESOURCES_KIND = "crisis_resources";

/** Which resource set a level earns in a DM. `elevated` gets the support set —
 * the same threshold at which the reflect flow shows resources. */
export function crisisResourcesFor(level: SafeguardLevel): Resource[] | null {
  if (level === "crisis") return CRISIS_RESOURCES;
  if (level === "elevated") return SUPPORT_RESOURCES;
  return null;
}

/**
 * The post-delivery lane (#344). Scheduled by the Stream webhook after the
 * push has been scheduled, so a failure here can never delay a notification.
 * One model call per qualifying message; the verdict row is the only thing
 * written, and the message text is never stored.
 */
export const moderateChatMessage = internalAction({
  args: {
    conversationId: v.id("xolacer_conversations"),
    senderRole: conversationRoleValidator,
    streamChannelId: v.string(),
    streamMessageId: v.string(),
    text: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // A redelivered webhook that slipped past the `x-webhook-id` guard (header
    // dropped) still costs nothing here.
    const seen: boolean = await ctx.runQuery(internal.ai.chat.moderate.hasVerdict, {
      streamMessageId: args.streamMessageId,
    });
    if (seen) return null;

    const prompt = buildChatModerationPrompt(args.text, args.senderRole);
    const response = await getAnthropicClient().messages.create({
      model: CHAT_MODERATION_MODEL,
      max_tokens: 200,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });
    const verdict = parseChatModerationResponse(extractTextFromResponse(response));

    const categories = (["harassment", "spam", "contact"] as const).filter((c) => verdict[c]);

    // Effects before the row: a Stream call that fails leaves no verdict, so
    // a retry (Stream's, or a manual re-run) gets another go instead of finding
    // a row that says "done" over a card that never arrived. ponytail: two
    // copies racing past `hasVerdict` could both send; the webhook-id guard
    // makes that a dropped-header edge, not the normal path.
    const resources = crisisResourcesFor(verdict.crisis);
    if (resources) {
      await sendStreamSystemMessage(args.streamChannelId, {
        // Fallback for a client without the card override.
        text: "Support is available — see the resources below.",
        kind: CRISIS_RESOURCES_KIND,
        level: verdict.crisis,
        resources,
      });
    }
    if (categories.length > 0) {
      await flagStreamMessage(args.streamMessageId, categories.join(","));
    }

    await ctx.runMutation(internal.ai.chat.moderate.recordVerdict, {
      conversationId: args.conversationId,
      streamMessageId: args.streamMessageId,
      senderRole: args.senderRole,
      level: verdict.crisis,
      categories,
      confidence: verdict.confidence,
    });
    return null;
  },
});

export const hasVerdict = internalQuery({
  args: { streamMessageId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { streamMessageId }) => {
    const row = await ctx.db
      .query("chat_moderation_events")
      .withIndex("by_messageId", (q) => q.eq("streamMessageId", streamMessageId))
      .unique();
    return row !== null;
  },
});

/** Inserts once per message — a row already there is left alone. */
export const recordVerdict = internalMutation({
  args: {
    conversationId: v.id("xolacer_conversations"),
    streamMessageId: v.string(),
    senderRole: conversationRoleValidator,
    level: safeguardLevelValidator,
    categories: v.array(chatModerationCategoryValidator),
    confidence: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chat_moderation_events")
      .withIndex("by_messageId", (q) => q.eq("streamMessageId", args.streamMessageId))
      .unique();
    if (existing) return null;
    await ctx.db.insert("chat_moderation_events", {
      ...args,
      modelVersion: CHAT_MODERATION_VERSION,
      createdAt: Date.now(),
    });
    return null;
  },
});
