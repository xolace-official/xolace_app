import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import { hasPremium } from "../../lib/premium";
import { posthog } from "../../posthog";

/**
 * Kindling generation entry point (docs/paths-v1.md §2.1, §5, §6; #330).
 *
 * Scheduled as a sibling from `finalizeCompletion` on the genuine
 * `completeSession` route only. Off the critical path and best-effort: every
 * failure is logged, nothing is thrown, the session never waits on it.
 *
 * The premium gate lives HERE, not at the call site (ADR 0009): a free user
 * is a silent no-op — no log noise, no compute.
 *
 * This slice is deterministic and content-free: the always-available
 * breathing twig plus the xolacer ranker's stored verdict. The model call
 * (§2.2) and the catalog binder (§2.3) replace `buildTwigs` in a later slice;
 * the trigger, gate, lifecycle and cascade are what this file proves.
 */

const MODEL = "none";
const MODEL_VERSION = "deterministic-v0";
const MIN_TWIGS = 2;

type Twig = Pick<Doc<"path_steps">, "actionType" | "order" | "why" | "params">;

function buildTwigs(understanding: Doc<"emotional_metadata">): Twig[] {
  const twigs: Twig[] = [
    {
      actionType: "breathing",
      order: 1,
      why: "A minute of slow breathing, right here, before you move on.",
      params: { exercise: "sit-with-this" },
    },
  ];
  // The person is chosen at read time by `xolacerChat.sessionSuggestion` and
  // never stored — only the specialty the ranker resolved travels with the twig.
  if (understanding.suggestedSpecialty) {
    twigs.push({
      actionType: "xolacer",
      order: 2,
      why: "Someone here has sat with this too, if you'd rather not carry it alone.",
      params: { specialty: understanding.suggestedSpecialty },
    });
  }
  return twigs;
}

async function generate(
  ctx: MutationCtx,
  args: {
    sessionId: Id<"sessions">;
    emotionalProfileId: Id<"emotional_profiles">;
  },
): Promise<void> {
  const profile = await ctx.db.get("emotional_profiles", args.emotionalProfileId);
  if (!profile || !(await hasPremium(ctx, profile))) return;

  const understanding = await ctx.db
    .query("emotional_metadata")
    .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
    .unique();
  // Absent (pre-classifier rows) reads as "none" — §1.
  const supportNeed = understanding?.supportNeed ?? "none";
  if (!understanding || supportNeed === "none") return;

  const twigs = buildTwigs(understanding);
  if (twigs.length < MIN_TWIGS) {
    console.error("kindling: no-ship, fewer than 2 twigs", {
      sessionId: args.sessionId,
      twigs: twigs.length,
    });
    return;
  }

  // One active kindling per user: archive, never delete (§6).
  const previous = await ctx.db
    .query("paths")
    .withIndex("by_profile_and_status", (q) =>
      q.eq("emotionalProfileId", args.emotionalProfileId).eq("status", "active"),
    )
    .take(10);
  for (const path of previous) {
    await ctx.db.patch("paths", path._id, { status: "replaced" });
  }

  const pathId = await ctx.db.insert("paths", {
    emotionalProfileId: args.emotionalProfileId,
    sessionId: args.sessionId,
    // Soft reference: dataRetention prunes old semantic_profiles versions
    // independently, so readers must tolerate a dangling id.
    emotionalProfileVersionId: profile.currentSemanticProfileId,
    status: "active",
    model: MODEL,
    modelVersion: MODEL_VERSION,
    generatedAt: Date.now(),
  });
  for (const twig of twigs) {
    await ctx.db.insert("path_steps", { pathId, ...twig, state: "pending" });
  }

  // Analytics only after the last write: a throw here is swallowed by `run`
  // and the mutation commits, so nothing may sit between the writes.
  for (const path of previous) {
    await posthog.capture(ctx, {
      distinctId: args.emotionalProfileId,
      event: "path_replaced",
      properties: { pathId: path._id, replacedBySessionId: args.sessionId },
    });
  }
  await posthog.capture(ctx, {
    distinctId: args.emotionalProfileId,
    event: "path_generated",
    properties: { pathId, sessionId: args.sessionId, twigs: twigs.length },
  });
}

export const run = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    emotionalProfileId: v.id("emotional_profiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Every read, gate and external call sits outside the write span, so a
    // caught throw leaves either a whole kindling or none — never a
    // replaced previous with no successor.
    try {
      await generate(ctx, args);
    } catch (error) {
      console.error("kindling: generation failed", {
        sessionId: args.sessionId,
        error,
      });
    }
    return null;
  },
});
