import { v } from "convex/values";
import { query } from "./_generated/server";
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
