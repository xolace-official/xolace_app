import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { hasPremium } from "./lib/premium";
import { posthog } from "./posthog";

/**
 * Kindling reads + twig state for the active-kindling screen
 * (docs/paths-v1.md §9.1, #333).
 *
 * Everything here is premium-gated at the read: a free user gets `null`, not
 * an empty kindling, so the Today row and the screen both fall away with one
 * check (ADR 0009 — no free compute, and no free surface either).
 */

/** Display family for a twig — what the card and the rail node render as. */
export type TwigKind = "breathing" | "xolacer" | "audio" | "music";

function twigKind(actionType: string): TwigKind {
  if (actionType === "breathing") return "breathing";
  if (actionType === "xolacer") return "xolacer";
  return actionType.startsWith("music_topic_") ? "music" : "audio";
}

const twigValidator = v.object({
  _id: v.id("path_steps"),
  actionType: v.string(),
  kind: v.union(
    v.literal("breathing"),
    v.literal("xolacer"),
    v.literal("audio"),
    v.literal("music"),
  ),
  order: v.number(),
  why: v.string(),
  /** Track title for bound audio/music; undefined for breathing + xolacer. */
  title: v.optional(v.string()),
  params: v.any(),
  state: v.union(v.literal("pending"), v.literal("done"), v.literal("skipped")),
});

/**
 * The one active kindling, or null — null being the common answer: free user,
 * no qualifying session yet, or the last one tended and closed.
 */
export const getActive = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("paths"),
      sessionId: v.id("sessions"),
      generatedAt: v.number(),
      twigs: v.array(twigValidator),
    }),
  ),
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    if (!(await hasPremium(ctx, profile))) return null;

    const path = await ctx.db
      .query("paths")
      .withIndex("by_profile_and_status", (q) =>
        q.eq("emotionalProfileId", profile._id).eq("status", "active"),
      )
      .first();
    if (!path) return null;

    const steps = await ctx.db
      .query("path_steps")
      .withIndex("by_path", (q) => q.eq("pathId", path._id))
      .collect();

    const twigs = [];
    for (const step of steps.sort((a, b) => a.order - b.order)) {
      const slug = (step.params as { slug?: string } | null)?.slug;
      const track = slug
        ? await ctx.db
            .query("audio_tracks")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .unique()
        : null;
      twigs.push({
        _id: step._id,
        actionType: step.actionType,
        kind: twigKind(step.actionType),
        order: step.order,
        why: step.why,
        title: track?.title,
        params: step.params,
        state: step.state,
      });
    }

    return {
      _id: path._id,
      sessionId: path.sessionId,
      generatedAt: path.generatedAt,
      twigs,
    };
  },
});

/** Load a twig the caller owns, on the still-active kindling. */
async function ownedStep(
  ctx: QueryCtx | MutationCtx,
  stepId: Id<"path_steps">,
): Promise<{ profile: Doc<"emotional_profiles">; step: Doc<"path_steps">; path: Doc<"paths"> }> {
  const { profile } = await requireAuth(ctx);
  const step = await ctx.db.get("path_steps", stepId);
  const path = step ? await ctx.db.get("paths", step.pathId) : null;
  if (!step || !path || path.emotionalProfileId !== profile._id) {
    throw new ConvexError({ code: "step_not_found", message: "Twig not found" });
  }
  // A stale screen (dismissed elsewhere, or replaced by a fresh generation)
  // must not write state or events onto an archived kindling.
  if (path.status !== "active") {
    throw new ConvexError({ code: "path_not_active", message: "Kindling is no longer active" });
  }
  return { profile, step, path };
}

/**
 * Settle every twig's state and close the kindling once nothing is pending.
 * `replaced` / `dismissed` are terminal — a late tap must not resurrect one.
 */
async function settle(
  ctx: MutationCtx,
  path: Doc<"paths">,
  profileId: Id<"emotional_profiles">,
) {
  if (path.status !== "active") return;
  const steps = await ctx.db
    .query("path_steps")
    .withIndex("by_path", (q) => q.eq("pathId", path._id))
    .collect();
  if (steps.some((s) => s.state === "pending")) return;
  await ctx.db.patch("paths", path._id, { status: "completed" });
  await posthog.capture(ctx, {
    distinctId: profileId,
    event: "path_completed",
    properties: { pathId: path._id, twigs: steps.length },
  });
}

const setState = (event: "step_completed" | "step_skipped", state: "done" | "skipped") =>
  mutation({
    args: { stepId: v.id("path_steps") },
    returns: v.null(),
    handler: async (ctx, args) => {
      const { profile, step, path } = await ownedStep(ctx, args.stepId);
      if (step.state === state) return null;
      await ctx.db.patch("path_steps", step._id, { state });
      await posthog.capture(ctx, {
        distinctId: profile._id,
        event,
        properties: { pathId: path._id, actionType: step.actionType, order: step.order },
      });
      await settle(ctx, path, profile._id);
      return null;
    },
  });

/**
 * Mark a twig tended. Called when the user finishes the thing the twig sent
 * them to — today that is the destination screen's business (#334 and the
 * completion-tracking ticket), so this is the seam those call.
 */
export const completeStep = setState("step_completed", "done");

/** "Not for me" — the skip, and the correction signal for the binder (§9.6). */
export const skipStep = setState("step_skipped", "skipped");

/** Close the whole kindling without tending the rest (§6). */
export const dismiss = mutation({
  args: { pathId: v.id("paths") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const path = await ctx.db.get("paths", args.pathId);
    if (!path || path.emotionalProfileId !== profile._id) {
      throw new ConvexError({ code: "path_not_found", message: "Kindling not found" });
    }
    if (path.status !== "active") return null;
    await ctx.db.patch("paths", path._id, { status: "dismissed" });
    await posthog.capture(ctx, {
      distinctId: profile._id,
      event: "path_dismissed",
      properties: { pathId: path._id },
    });
    return null;
  },
});
