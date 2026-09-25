import { v, type Infer } from "convex/values";
import { mutation, query, type QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { requireAuth } from "../lib/auth";
import { recentUnderstandings } from "../understanding";
import { cardItemValidator, entryIdsWithFacet, toListItem } from "./entries";
import { cardSignals } from "./reads";
import { hubValidator, toHub } from "./hubs";

/**
 * The Library home (#409, CONTEXT.md "Library: where it lives"): one read for
 * everything the front page shows, plus the "Reading as…" write.
 *
 * For you is a deterministic facet match — chosen audiences interleaved with
 * the emotions and life areas of the reader's recent Understanding. No model
 * call (Constitution Rule), never padded.
 */

// ponytail: the home scans the active catalogue, and each axis's facet rows
// (all slugs together, not per slug), up to CATALOGUE_SCAN — fine for a
// curated shelf of hundreds; move counts to a denormalised row when it
// outgrows that.
const CATALOGUE_SCAN = 500;
const FOR_YOU_MAX = 6;
const RECENT_SESSIONS = 5;
const MAX_AUDIENCES = 10;

const signalAxis = v.union(v.literal("audience"), v.literal("emotion"), v.literal("lifeArea"));
type Signal = { axis: Infer<typeof signalAxis>; slug: string };
const facetCountValidator = v.array(v.object({ slug: v.string(), count: v.number() }));

async function activeEntries(ctx: QueryCtx) {
  const rows = await ctx.db
    .query("library_entries")
    .withIndex("by_active_and_kind", (q) => q.eq("active", true))
    .take(CATALOGUE_SCAN);
  return new Map(rows.map((e) => [e._id, e]));
}

/** Slug → count, alphabetical, counting only active entries. */
async function facetCounts(ctx: QueryCtx, axis: string, active: Set<Id<"library_entries">>) {
  const rows = await ctx.db
    .query("library_entry_facets")
    .withIndex("by_axis_and_slug", (q) => q.eq("axis", axis))
    .take(CATALOGUE_SCAN);
  const counts = new Map<string, number>();
  for (const r of rows) if (active.has(r.entryId)) counts.set(r.slug, (counts.get(r.slug) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([slug, count]) => ({ slug, count }));
}

/**
 * Audiences interleaved with the recent Understanding (emotions, then life
 * areas, newest first), so neither side can crowd the other out.
 */
async function forYouSignals(ctx: QueryCtx, profileId: Id<"emotional_profiles">, audiences: string[]) {
  const recent = await recentUnderstandings(ctx, profileId, RECENT_SESSIONS);
  // A crisis moment never becomes a reading suggestion.
  const safe = recent.filter(
    (m) => !m.riskFlag && m.safeguardLevel !== "crisis" && m.safeguardLevel !== "elevated",
  );
  const chosen: Signal[] = audiences.map((slug) => ({ axis: "audience", slug }));
  const understood: Signal[] = [
    ...[...new Set(safe.map((m) => m.primaryEmotion))].map((slug) => ({ axis: "emotion" as const, slug })),
    ...[...new Set(safe.flatMap((m) => m.thematicTags))].map((slug) => ({ axis: "lifeArea" as const, slug })),
  ];
  const n = Math.max(chosen.length, understood.length);
  return Array.from({ length: n }, (_, i) => [chosen[i], understood[i]]).flat().filter((s) => s !== undefined);
}

/** Round-robin: each signal gives its next unpicked entry per round. Never padded. */
async function forYou(
  ctx: QueryCtx,
  profileId: Id<"emotional_profiles">,
  signals: Signal[],
  active: Map<Id<"library_entries">, Doc<"library_entries">>,
) {
  const matches = await Promise.all(signals.map((s) => entryIdsWithFacet(ctx, s.axis, s.slug)));
  const lists = matches.map((ids) => [...ids].filter((id) => active.has(id)));
  const picked = new Map<Id<"library_entries">, Signal>();
  const rounds = Math.max(0, ...lists.map((l) => l.length));
  for (let r = 0; r < rounds && picked.size < FOR_YOU_MAX; r++) {
    lists.forEach((list, i) => {
      const id = list[r];
      if (id && !picked.has(id) && picked.size < FOR_YOU_MAX) picked.set(id, signals[i]);
    });
  }
  return await Promise.all(
    [...picked].map(async ([id, reason]) => ({
      entry: { ...toListItem(active.get(id)!), ...(await cardSignals(ctx, profileId, id)) },
      reason,
    })),
  );
}

async function readingAsRow(ctx: QueryCtx, profileId: Id<"emotional_profiles">) {
  return await ctx.db
    .query("preferences")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
    .unique();
}

export const getHome = query({
  args: {},
  returns: v.object({
    // null = never answered: show the one-time card.
    readingAs: v.union(v.null(), v.array(v.string())),
    audiences: facetCountValidator,
    forYou: v.array(v.object({ entry: cardItemValidator, reason: v.object({ axis: signalAxis, slug: v.string() }) })),
    hubs: v.array(
      v.object({ ...hubValidator.fields, entries: v.number(), listens: v.number() }),
    ),
  }),
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const [prefs, active, hubs] = await Promise.all([
      readingAsRow(ctx, profile._id),
      activeEntries(ctx),
      ctx.db
        .query("library_hubs")
        .withIndex("by_active", (q) => q.eq("active", true))
        .take(50),
    ]);
    const activeIds = new Set(active.keys());
    const readingAs = prefs?.libraryAudiences ?? null;
    const trackIds = [
      ...new Set(hubs.flatMap((h) => h.items.flatMap((i) => (i.kind === "audio" ? [i.audioTrackId] : [])))),
    ];

    const [audiences, signals, tracks] = await Promise.all([
      facetCounts(ctx, "audience", activeIds),
      forYouSignals(ctx, profile._id, readingAs ?? []),
      Promise.all(trackIds.map((id) => ctx.db.get("audio_tracks", id))),
    ]);
    // Same rule as the hub detail: an inactive track isn't there to listen to.
    const activeTracks = new Set(tracks.flatMap((t) => (t?.active ? [t._id] : [])));

    return {
      readingAs,
      audiences,
      forYou: await forYou(ctx, profile._id, signals, active),
      hubs: hubs.map((h) => ({
        ...toHub(h),
        entries: h.items.filter((i) => i.kind === "entry" && activeIds.has(i.entryId)).length,
        listens: h.items.filter((i) => i.kind === "audio" && activeTracks.has(i.audioTrackId)).length,
      })),
    };
  },
});

/** Lantern A–Z: every subject with active entries, alphabetical, with counts. */
export const getSubjects = query({
  args: {},
  returns: facetCountValidator,
  handler: async (ctx) => {
    await requireAuth(ctx);
    const active = await activeEntries(ctx);
    return await facetCounts(ctx, "subject", new Set(active.keys()));
  },
});

/** "Reading as…": replaces the chosen audiences. [] is a valid answer (dismissed). */
export const setReadingAs = mutation({
  args: { audiences: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const prefs = await readingAsRow(ctx, profile._id);
    if (!prefs) throw new Error("Preferences not found");
    const audiences = [...new Set(args.audiences.map((a) => a.trim().slice(0, 40)).filter(Boolean))];
    await ctx.db.patch("preferences", prefs._id, { libraryAudiences: audiences.slice(0, MAX_AUDIENCES) });
    return null;
  },
});
