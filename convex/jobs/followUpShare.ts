import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { distillerCache, moderationCache } from "../ai/cached";
import { buildDistillerPrompt } from "../ai/prompts/distiller";
import { isFollowUpPoolable } from "../lib/poolability";

/** The response's text, whether it may still share, and its source session. */
export const loadForShare = internalQuery({
  args: { responseId: v.id("follow_up_responses") },
  returns: v.union(
    v.null(),
    v.object({
      shareable: v.boolean(),
      text: v.string(),
      mirrorText: v.string(),
      sessionId: v.id("sessions"),
    }),
  ),
  handler: async (ctx, args) => {
    const response = await ctx.db.get("follow_up_responses", args.responseId);
    if (!response) return null;
    const card = await ctx.db.get("follow_up_cards", response.cardId);
    if (!card) return null;
    const session = await ctx.db.get("sessions", card.sessionId);
    if (!session) return null;
    return {
      shareable: isFollowUpPoolable({
        shareRequested: response.shareRequested,
        reflectionText: response.reflectionText,
        tier: card.tier,
        escalationDerived: card.escalationDerived,
        safeguardLevel: session.safeguardLevel,
      }),
      text: response.reflectionText ?? "",
      mirrorText: session.mirrorText ?? "",
      sessionId: session._id,
    };
  },
});

/**
 * Share a follow-up "what helped?" reflection (#449) into the peer pool the
 * way session text gets there: moderated, then through the same voice-
 * preserving anonymizer, then `reflections.contribute` (no author link).
 * Gates are re-read at run time so a revoked share never lands. Fails closed:
 * a flagged text, a moderation outage, or a NULL distillation shares nothing.
 */
export const share = internalAction({
  args: { responseId: v.id("follow_up_responses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const loaded = await ctx.runQuery(internal.jobs.followUpShare.loadForShare, args);
    if (!loaded?.shareable) return null;
    const { text, mirrorText, sessionId } = loaded;
    // The matching fingerprint is the source session's Understanding.
    const metadata = await ctx.runQuery(internal.understanding.getUnderstanding, { sessionId });
    if (!metadata) return null;

    try {
      const moderation = await moderationCache.fetch(ctx, { text });
      if (moderation.flagged) return null;

      const prompt = buildDistillerPrompt({
        rawInput: text,
        mirrorText,
        primaryEmotion: metadata.primaryEmotion,
        granularLabel: metadata.granularLabel,
        intensity: metadata.intensity,
        thematicTags: metadata.thematicTags,
        userLanguageTags: metadata.userLanguageTags,
      });
      const distilled = await distillerCache.fetch(ctx, {
        systemPrompt: prompt.system,
        userPrompt: prompt.user,
      });
      if (!distilled || distilled === "NULL") return null;

      await ctx.runMutation(internal.reflections.contribute, {
        displayText: distilled,
        primaryEmotion: metadata.primaryEmotion,
        granularLabel: metadata.granularLabel,
        thematicTags: metadata.thematicTags,
        intensity: metadata.intensity,
      });
    } catch (error) {
      console.error("Follow-up share failed:", error);
    }
    return null;
  },
});
