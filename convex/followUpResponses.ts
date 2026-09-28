import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";

// Same order of magnitude as a product-feedback note — a sentence or a few,
// never a session transcript.
export const REFLECTION_MAX_LENGTH = 2000;

/**
 * Record (or replace) the structured response to a follow-up card: the
 * "what helped?" text, the share flag, and the heavier-menu choice. Upserts —
 * one row per card, the latest submit wins. The chip itself is still written
 * by `followUps.resolveCard`; this never touches `follow_up_cards`.
 */
export const record = mutation({
  args: {
    cardId: v.id("follow_up_cards"),
    reflectionText: v.optional(v.string()),
    shareRequested: v.boolean(),
    heavierChoice: v.optional(
      v.union(
        v.literal("crisis_resources"),
        v.literal("music"),
        v.literal("support_audio"),
        v.literal("library"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const card = await ctx.db.get("follow_up_cards", args.cardId);
    if (!card || card.emotionalProfileId !== profile._id) return null;

    const text = args.reflectionText?.trim() || undefined;
    if (text && text.length > REFLECTION_MAX_LENGTH) {
      throw new ConvexError({
        code: "reflection_too_long",
        message: `Reflection exceeds ${REFLECTION_MAX_LENGTH} characters`,
      });
    }

    const fields = {
      reflectionText: text,
      shareRequested: args.shareRequested,
      heavierChoice: args.heavierChoice,
      updatedAt: Date.now(),
    };
    const existing = await ctx.db
      .query("follow_up_responses")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .first();
    if (existing) {
      await ctx.db.patch("follow_up_responses", existing._id, fields);
    } else {
      await ctx.db.insert("follow_up_responses", {
        ...fields,
        cardId: args.cardId,
        emotionalProfileId: profile._id,
        createdAt: fields.updatedAt,
      });
    }
    return null;
  },
});

/** The caller's response for one of their cards, or null. */
export const getForCard = query({
  args: { cardId: v.id("follow_up_cards") },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const row = await ctx.db
      .query("follow_up_responses")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .first();
    return row && row.emotionalProfileId === profile._id ? row : null;
  },
});

/** Delete a card's response. Every path that deletes a card calls this first. */
export async function deleteResponsesForCard(
  ctx: MutationCtx,
  cardId: Id<"follow_up_cards">,
): Promise<void> {
  const rows = await ctx.db
    .query("follow_up_responses")
    .withIndex("by_card", (q) => q.eq("cardId", cardId))
    .take(10);
  for (const row of rows) await ctx.db.delete("follow_up_responses", row._id);
}
