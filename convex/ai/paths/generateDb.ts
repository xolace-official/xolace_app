import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import type { Doc } from "../../_generated/dataModel";
import { hasPremium } from "../../lib/premium";
import { renderSemanticProfile } from "../../semanticProfiles";
import { posthog } from "../../posthog";
import type { PathsPromptUnderstanding } from "./prompt";

/**
 * Kindling generation — the DB halves of `generate.ts` (#331): the context
 * read that also carries the gates, and the single write that lands a whole
 * kindling or nothing.
 */

export interface GenerateContext {
  understanding: PathsPromptUnderstanding;
  profile: string | null;
  semanticProfileId: Doc<"emotional_profiles">["currentSemanticProfileId"];
  suggestedSpecialty: Doc<"emotional_metadata">["suggestedSpecialty"];
}

/**
 * Null means "do nothing, silently": free user (ADR 0009), no Understanding
 * yet, or `supportNeed` absent/none (§1 — pre-classifier rows read as none).
 */
export const getContext = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    emotionalProfileId: v.id("emotional_profiles"),
  },
  handler: async (ctx, args): Promise<GenerateContext | null> => {
    const profile = await ctx.db.get("emotional_profiles", args.emotionalProfileId);
    if (!profile || !(await hasPremium(ctx, profile))) return null;

    const u = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    const supportNeed = u?.supportNeed ?? "none";
    if (!u || supportNeed === "none") return null;

    const semantic = profile.currentSemanticProfileId
      ? await ctx.db.get("semantic_profiles", profile.currentSemanticProfileId)
      : null;

    return {
      understanding: {
        primaryEmotion: u.primaryEmotion,
        granularLabel: u.granularLabel,
        intensity: u.intensity,
        specificity: u.specificity,
        thematicTags: u.thematicTags,
        userLanguageTags: u.userLanguageTags,
        temporalContext: u.temporalContext,
        supportNeed,
        safeguardLevel: u.safeguardLevel,
      },
      profile: semantic ? renderSemanticProfile(semantic) : null,
      semanticProfileId: profile.currentSemanticProfileId,
      suggestedSpecialty: u.suggestedSpecialty,
    };
  },
});

const twigValidator = v.object({
  actionType: v.string(),
  order: v.number(),
  why: v.string(),
  params: v.any(),
});

/**
 * Archive the previous active kindling (never delete, §6) and write the new
 * one. Analytics only after the last write: a throw there is swallowed by
 * the caller and the mutation still commits.
 */
export const write = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    emotionalProfileId: v.id("emotional_profiles"),
    semanticProfileId: v.optional(v.id("semantic_profiles")),
    model: v.string(),
    modelVersion: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    twigs: v.array(twigValidator),
  },
  returns: v.id("paths"),
  handler: async (ctx, args) => {
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
      emotionalProfileVersionId: args.semanticProfileId,
      status: "active",
      model: args.model,
      modelVersion: args.modelVersion,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      generatedAt: Date.now(),
    });
    for (const twig of args.twigs) {
      await ctx.db.insert("path_steps", { pathId, ...twig, state: "pending" });
    }

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
      properties: {
        pathId,
        sessionId: args.sessionId,
        modelVersion: args.modelVersion,
        twigs: args.twigs.length,
        actionTypes: args.twigs.map((t) => t.actionType),
      },
    });
    return pathId;
  },
});
