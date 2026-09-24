import { v } from "convex/values";
import { query, type QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { requireAuth } from "../lib/auth";
import schema from "../schema";

/**
 * Library base reads (#405, CONTEXT.md "Library", ADR 0015). Open to every
 * signed-in user. Curator-only fields (`lastReviewedAt`, `safetyReviewedAt`,
 * `consentRecordedAt`) never leave this folder — the returns validators
 * are the allow-list.
 */

const { kind: kindValidator, reuse: reuseValidator } = schema.tables.library_entries.validator.fields;

export const listItemValidator = v.object({
  _id: v.id("library_entries"),
  slug: v.string(),
  kind: kindValidator,
  title: v.string(),
  dek: v.string(),
  primarySubject: v.string(),
  readMin: v.number(),
  coverUrl: v.optional(v.string()),
  newUntil: v.optional(v.number()),
});

export const toListItem = (e: Doc<"library_entries">) => ({
  _id: e._id,
  slug: e.slug,
  kind: e.kind,
  title: e.title,
  dek: e.dek,
  primarySubject: e.primarySubject,
  readMin: e.readMin,
  coverUrl: e.coverUrl,
  newUntil: e.newUntil,
});

/**
 * One entry by slug, with its body, source credit and facets. Inactive
 * (retracted) entries are still returned, flagged, so a reader who saved or
 * started one keeps read-only access (#404); every list/hub read skips them.
 */
export const getEntry = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      ...listItemValidator.fields,
      active: v.boolean(),
      reuse: reuseValidator,
      originalUrl: v.optional(v.string()),
      author: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      storyDescriptor: v.optional(v.string()),
      markdown: v.string(),
      source: v.object({
        name: v.string(),
        url: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        attributionText: v.string(),
      }),
      facets: v.array(v.object({ axis: v.string(), slug: v.string() })),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const e = await ctx.db
      .query("library_entries")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!e) return null;

    const [body, source, facets] = await Promise.all([
      ctx.db
        .query("library_entry_bodies")
        .withIndex("by_entryId", (q) => q.eq("entryId", e._id))
        .unique(),
      ctx.db.get("library_sources", e.sourceId),
      ctx.db
        .query("library_entry_facets")
        .withIndex("by_entryId", (q) => q.eq("entryId", e._id))
        .take(100),
    ]);
    // Ingest writes all three together; a missing half is a broken row.
    if (!body || !source) throw new Error(`Library entry ${e.slug} is missing its body or source`);

    return {
      ...toListItem(e),
      active: e.active,
      reuse: e.reuse,
      originalUrl: e.originalUrl,
      author: e.author,
      publishedAt: e.publishedAt,
      storyDescriptor: e.storyDescriptor,
      markdown: body.markdown,
      source: {
        name: source.name,
        url: source.url,
        logoUrl: source.logoUrl,
        attributionText: source.attributionText,
      },
      facets: facets.map((f) => ({ axis: f.axis, slug: f.slug })),
    };
  },
});

const MAX_LIMIT = 100;
// ponytail: facet filters scan up to this many rows per (axis, slug) and
// intersect in memory — fine for a curated catalogue of hundreds; paginate
// when one facet value outgrows it.
const FACET_SCAN = 500;

async function entryIdsWithFacet(ctx: QueryCtx, axis: string, slug: string) {
  const rows = await ctx.db
    .query("library_entry_facets")
    .withIndex("by_axis_and_slug", (q) => q.eq("axis", axis).eq("slug", slug))
    .take(FACET_SCAN);
  return new Set(rows.map((r) => r.entryId));
}

/** Active entries, optionally narrowed by kind, subject and audience. Bounded. */
export const listEntries = query({
  args: {
    kind: v.optional(kindValidator),
    subject: v.optional(v.string()),
    audience: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(listItemValidator),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 50), MAX_LIMIT));
    const facetFilters: [string, string][] = [];
    if (args.subject) facetFilters.push(["subject", args.subject]);
    if (args.audience) facetFilters.push(["audience", args.audience]);

    if (facetFilters.length === 0) {
      const { kind } = args;
      const rows = await ctx.db
        .query("library_entries")
        .withIndex("by_active_and_kind", (q) =>
          kind ? q.eq("active", true).eq("kind", kind) : q.eq("active", true),
        )
        .take(limit);
      return rows.map(toListItem);
    }

    const [first, ...rest] = await Promise.all(
      facetFilters.map(([axis, slug]) => entryIdsWithFacet(ctx, axis, slug)),
    );
    const ids = [...first].filter((id) => rest.every((s) => s.has(id)));
    const rows = await Promise.all(ids.map((id) => ctx.db.get("library_entries", id)));
    return rows
      .filter((e): e is Doc<"library_entries"> => !!e && e.active && (!args.kind || e.kind === args.kind))
      .slice(0, limit)
      .map(toListItem);
  },
});
