import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import { hasPremium } from "../../lib/premium";
import { rateLimiter } from "../../lib/rateLimits";
import { renderSemanticProfile } from "../../semanticProfiles";
import { posthog } from "../../posthog";
import type { PathsPromptUnderstanding } from "./prompt";
import type { BindEntry, BindTrack, BindUnderstanding } from "./bind";
import { readRow } from "../../library/reads";

/**
 * Kindling generation — the DB halves of `generate.ts` (#331): the context
 * read that also carries the gates, and the single write that lands a whole
 * kindling or nothing.
 */

export interface GenerateContext {
  understanding: PathsPromptUnderstanding;
  profile: string | null;
  semanticProfileId: Doc<"emotional_profiles">["currentSemanticProfileId"];
  binding: BindUnderstanding;
  tracks: BindTrack[];
  entries: BindEntry[];
}

// ponytail: the whole active catalogue in one read (~200–400 rows, six small
// fields). Per-topic index reads if the catalogue outgrows a single query.
const MAX_TRACKS = 2000;

// ponytail: per facet value, the first N tagged entries. Fine for a
// hand-curated Library; rank inside the index if a facet outgrows it.
const MAX_ENTRIES_PER_FACET = 200;

/**
 * Library entries whose `emotion` / `lifeArea` facets overlap this
 * Understanding (#412), carrying only the matched facets — the binder's score
 * is their count. Retracted and already-finished entries are left out, and
 * an elevated/crisis session matches nothing (ADR 0015 twig safety).
 */
async function loadReadCandidates(
  ctx: QueryCtx,
  profileId: Id<"emotional_profiles">,
  u: Doc<"emotional_metadata">,
): Promise<BindEntry[]> {
  if (u.safeguardLevel === "elevated" || u.safeguardLevel === "crisis") return [];
  const wanted = [
    ...[u.primaryEmotion, u.secondaryEmotion].filter((s): s is string => !!s).map((slug) => ({ axis: "emotion", slug })),
    ...u.thematicTags.map((slug) => ({ axis: "lifeArea", slug })),
  ];
  const matched = new Map<Id<"library_entries">, { emotions: string[]; lifeAreas: string[] }>();
  for (const { axis, slug } of wanted) {
    const rows = await ctx.db
      .query("library_entry_facets")
      .withIndex("by_axis_and_slug", (q) => q.eq("axis", axis).eq("slug", slug))
      .take(MAX_ENTRIES_PER_FACET);
    for (const row of rows) {
      const m = matched.get(row.entryId) ?? { emotions: [], lifeAreas: [] };
      (axis === "emotion" ? m.emotions : m.lifeAreas).push(slug);
      matched.set(row.entryId, m);
    }
  }

  const entries: BindEntry[] = [];
  for (const [entryId, m] of matched) {
    const entry = await ctx.db.get("library_entries", entryId);
    if (!entry?.active) continue;
    if ((await readRow(ctx, profileId, entryId))?.finishedAt !== undefined) continue;
    entries.push({ slug: entry.slug, ...m });
  }
  return entries;
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

    const tracks = (await ctx.db.query("audio_tracks").take(MAX_TRACKS))
      .filter((t) => t.active)
      .map(({ slug, family, topic, tags, active, series }) => ({
        slug, family, topic, tags, active, series,
      }));

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
      binding: {
        primaryEmotion: u.primaryEmotion,
        secondaryEmotion: u.secondaryEmotion,
        thematicTags: u.thematicTags,
        suggestedSpecialty: u.suggestedSpecialty,
      },
      tracks,
      entries: await loadReadCandidates(ctx, profile._id, u),
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
 * Consume the day's kindling slot, archive the previous active kindling
 * (never delete, §6) and write the new one — one transaction, so a throw
 * anywhere rolls the slot back with the rows and a retry is still allowed.
 * Null = slot already spent; nothing written.
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
  returns: v.union(v.id("paths"), v.null()),
  handler: async (ctx, args) => {
    const slot = await rateLimiter.limit(ctx, "pathsGenerate", { key: args.emotionalProfileId });
    if (!slot.ok) return null;

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
