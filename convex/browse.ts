import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";
import { r2 } from "./ai/paths/audioTracks";

/**
 * Browse hub reads (#338, docs/paths-v1.md §9.3). Open to every signed-in
 * user — the free-user gate is on playback (the `player` route, #340), not
 * on browsing (§9.4) — so this file never calls `requirePremium`.
 */

const shelfItemValidator = v.object({
  _id: v.id("audio_tracks"),
  slug: v.string(),
  title: v.string(),
  thumbUrl: v.string(),
  attribution: v.optional(v.string()),
});

function attributionFor(track: { family: "support" | "music"; narrators?: string[]; licence?: { attributionRequired: boolean; attributionText: string } }) {
  if (track.family === "music") {
    return track.licence?.attributionRequired ? track.licence.attributionText : undefined;
  }
  return track.narrators && track.narrators.length > 0 ? track.narrators.join(", ") : undefined;
}

/**
 * The New shelf: `active` tracks whose `newUntil` is still in the future,
 * newest first, capped at 4. Self-expiring (a past `newUntil` just drops out
 * of the sort), so no cron. No new index — the catalogue is a bounded few
 * hundred rows (docs/paths-v1.md decision 18), so a full collect + in-memory
 * sort is the cheaper choice over indexing a field most rows leave unset.
 * Reused as-is for the Discovery "From the library" strip (§9.5).
 */
export const getNewShelf = query({
  args: {},
  returns: v.array(shelfItemValidator),
  handler: async (ctx) => {
    await requireAuth(ctx);
    const now = Date.now();

    const tracks = await ctx.db.query("audio_tracks").collect();
    const shelf = tracks
      .filter((t) => t.active && t.newUntil !== undefined && t.newUntil > now)
      .sort((a, b) => b.newUntil! - a.newUntil!)
      .slice(0, 4);

    return await Promise.all(
      shelf.map(async (t) => ({
        _id: t._id,
        slug: t.slug,
        title: t.title,
        thumbUrl: await r2.getUrl(t.thumbKey),
        attribution: attributionFor(t),
      })),
    );
  },
});

// ---------------------------------------------------------------------------
// Browsing screens (#339, docs/paths-v1.md §9.3)
// ---------------------------------------------------------------------------

const familyValidator = v.union(v.literal("support"), v.literal("music"));

const trackItemValidator = v.object({
  _id: v.id("audio_tracks"),
  slug: v.string(),
  family: familyValidator,
  title: v.string(),
  thumbUrl: v.string(),
  attribution: v.optional(v.string()),
  durationSec: v.number(),
  series: v.optional(v.string()),
  seriesTitle: v.optional(v.string()),
  episodeNumber: v.optional(v.number()),
});

async function toTrackItem(t: Doc<"audio_tracks">) {
  return {
    _id: t._id,
    slug: t.slug,
    family: t.family,
    title: t.title,
    thumbUrl: await r2.getUrl(t.thumbKey),
    attribution: attributionFor(t),
    durationSec: t.durationSec,
    series: t.series,
    seriesTitle: t.seriesTitle,
    episodeNumber: t.episodeNumber,
  };
}

/**
 * `audio_tracks.topic` is the catalog key (`audio_topic_sadness` /
 * `music_topic_sadness`); the suffix is the axis both families share and is
 * what the topic grid tiles and `topic/[slug]` routes on.
 */
const TOPIC_PREFIX = /^(audio|music)_topic_/;
const topicSlug = (topic: string) => topic.replace(TOPIC_PREFIX, "");
const topicTitle = (slug: string) => {
  const words = slug.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Per-family list — `active` rows only, page size chosen by the client (30). */
export const listByFamily = query({
  args: { family: familyValidator, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const result = await ctx.db
      .query("audio_tracks")
      .withIndex("by_family_and_active", (q) => q.eq("family", args.family).eq("active", true))
      .paginate(args.paginationOpts);
    return { ...result, page: await Promise.all(result.page.map(toTrackItem)) };
  },
});

async function activeByFamily(ctx: QueryCtx, family: Doc<"audio_tracks">["family"]) {
  // Bounded catalogue (docs/paths-v1.md decision 18) — a few hundred rows at most.
  return await ctx.db
    .query("audio_tracks")
    .withIndex("by_family_and_active", (q) => q.eq("family", family).eq("active", true))
    .take(1000);
}

/** Topic grid — one tile per shared topic with ≥ 1 active track in either family. */
export const getTopics = query({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      title: v.string(),
      thumbUrl: v.string(),
      supportCount: v.number(),
      musicCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireAuth(ctx);
    const tracks = [...(await activeByFamily(ctx, "support")), ...(await activeByFamily(ctx, "music"))];

    const byTopic = new Map<string, { thumbKey: string; supportCount: number; musicCount: number }>();
    for (const t of tracks) {
      const slug = topicSlug(t.topic);
      const entry = byTopic.get(slug) ?? { thumbKey: t.thumbKey, supportCount: 0, musicCount: 0 };
      if (t.family === "support") entry.supportCount += 1;
      else entry.musicCount += 1;
      byTopic.set(slug, entry);
    }

    return await Promise.all(
      [...byTopic.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(async ([slug, entry]) => ({
          slug,
          title: topicTitle(slug),
          thumbUrl: await r2.getUrl(entry.thumbKey),
          supportCount: entry.supportCount,
          musicCount: entry.musicCount,
        })),
    );
  },
});

/** Topic screen — both families' active tracks for one shared topic slug. */
export const getTopic = query({
  args: { slug: v.string() },
  returns: v.array(trackItemValidator),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const [support, music] = await Promise.all([
      ctx.db
        .query("audio_tracks")
        .withIndex("by_family_and_topic", (q) => q.eq("family", "support").eq("topic", `audio_topic_${args.slug}`))
        .take(1000),
      ctx.db
        .query("audio_tracks")
        .withIndex("by_family_and_topic", (q) => q.eq("family", "music").eq("topic", `music_topic_${args.slug}`))
        .take(1000),
    ]);
    return await Promise.all([...support, ...music].filter((t) => t.active).map(toTrackItem));
  },
});
