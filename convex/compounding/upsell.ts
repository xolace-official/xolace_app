/**
 * The compounding upsell (#524, #496 §4; CONTEXT.md "Free view, compounding
 * upsell"): a free user learns a named domain has been heavier than their
 * usual, with no number, on Insights and at session end. In the app only:
 * nothing here pushes, since the lock screen isn't private. At most once per
 * stretch, spent by markShown when the client shows it; never after a session
 * safeguard flagged or one that burned. Crisis resources and safety
 * follow-ups never pass through here, so they stay free in every state.
 */
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import { mutation, query, type QueryCtx } from "../_generated/server";
import { requireAuth, requireSessionOwnership } from "../lib/auth";
import { hasPremium } from "../lib/premium";
import { domainValidator } from "../lib/validators";
import { compoundingFor, spendStretch } from "./stretches";

const upsellValidator = v.object({ domain: domainValidator, stretchStartedAt: v.number() });

/**
 * Safeguard flagged it (elevated or crisis, on the session or its
 * Understanding, or an escalation), or it burned. The gate lives here, not
 * in compounding/stretches, which never reads safeguard state.
 */
async function flaggedOrBurned(ctx: QueryCtx, session: Doc<"sessions">): Promise<boolean> {
  if (session.kept === false || session.escalationTriggered === true) return true;
  const meta: Doc<"emotional_metadata"> | null = await ctx.runQuery(
    internal.understanding.getUnderstanding,
    { sessionId: session._id },
  );
  return [session.safeguardLevel, meta?.safeguardLevel].some((l) => l === "elevated" || l === "crisis");
}

/**
 * The stretch to name, or null. Session end passes its session; Insights
 * passes none and is judged by the person's latest session.
 */
export const get = query({
  args: { sessionId: v.optional(v.id("sessions")) },
  returns: v.union(upsellValidator, v.null()),
  handler: async (ctx, { sessionId }) => {
    const { profile, session } = sessionId
      ? await requireSessionOwnership(ctx, sessionId)
      : await latest(ctx);
    if (session && (await flaggedOrBurned(ctx, session))) return null;
    // An entitlement outage reads as Xolace+: never upsell someone who may have paid.
    if (await hasPremium(ctx, profile).catch(() => true)) return null;
    const top = (await compoundingFor(ctx, profile._id)).find(
      (c) => c.state === "compounding" && !c.upsellShown,
    );
    return top ? { domain: top.domain, stretchStartedAt: top.startedAt } : null;
  },
});

async function latest(ctx: QueryCtx) {
  const { profile } = await requireAuth(ctx);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_profile_time", (q) => q.eq("emotionalProfileId", profile._id))
    .order("desc")
    .first();
  return { profile, session };
}

/** It showed: spent for the stretch, wherever it showed (a dismissal holds too). */
export const markShown = mutation({
  args: upsellValidator.fields,
  returns: v.null(),
  handler: async (ctx, ref) => {
    const { profile } = await requireAuth(ctx);
    await spendStretch(ctx, profile._id, ref, "upsellShownAt");
    return null;
  },
});
