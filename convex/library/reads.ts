import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { requireAuth } from "../lib/auth";
import { listenMin } from "./audio";

/**
 * What a reader leaves behind on an entry (#410, CONTEXT.md "Library:
 * finished, helped, saved"). The row is private; only the totals in
 * `library_entry_totals` are ever shown to others (ADR 0016).
 */

/** "N found this helpful" stays hidden below this, so a small count can't point at anyone. */
export const HELPED_FLOOR = 15;

type EntryId = Id<"library_entries">;
type ProfileId = Id<"emotional_profiles">;

export const readRow = (ctx: QueryCtx, profileId: ProfileId, entryId: EntryId) =>
  ctx.db
    .query("library_reads")
    .withIndex("by_emotionalProfileId_and_entryId", (q) =>
      q.eq("emotionalProfileId", profileId).eq("entryId", entryId),
    )
    .unique();

const totalsRow = (ctx: QueryCtx, entryId: EntryId) =>
  ctx.db
    .query("library_entry_totals")
    .withIndex("by_entryId", (q) => q.eq("entryId", entryId))
    .unique();

async function bumpTotals(ctx: MutationCtx, entryId: EntryId, delta: { views?: number; helped?: number }) {
  const t = await totalsRow(ctx, entryId);
  const views = Math.max(0, (t?.views ?? 0) + (delta.views ?? 0));
  const helped = Math.max(0, (t?.helped ?? 0) + (delta.helped ?? 0));
  if (t) await ctx.db.patch("library_entry_totals", t._id, { views, helped });
  else await ctx.db.insert("library_entry_totals", { entryId, views, helped });
}

/** Views, listen time (#411) and this reader's saved state, for every entry card. */
export async function cardSignals(ctx: QueryCtx, profileId: ProfileId, entryId: EntryId) {
  const [t, r, listen] = await Promise.all([
    totalsRow(ctx, entryId),
    readRow(ctx, profileId, entryId),
    listenMin(ctx, entryId),
  ]);
  return { views: t?.views ?? 0, saved: r?.saved ?? false, listenMin: listen };
}

/** Attaches `cardSignals` to already-shaped list items. */
export const withCardSignals = <T extends { _id: EntryId }>(ctx: QueryCtx, profileId: ProfileId, items: T[]) =>
  Promise.all(items.map(async (i) => ({ ...i, ...(await cardSignals(ctx, profileId, i._id)) })));

/** The reader's own row plus the end-of-read total. */
export const getReaderState = query({
  args: { entryId: v.id("library_entries") },
  returns: v.object({
    saved: v.boolean(),
    helped: v.boolean(),
    finished: v.boolean(),
    position: v.union(v.null(), v.number()),
    helpedCount: v.union(v.null(), v.number()), // null below HELPED_FLOOR
  }),
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const [r, t] = await Promise.all([readRow(ctx, profile._id, args.entryId), totalsRow(ctx, args.entryId)]);
    const helpedCount = t?.helped ?? 0;
    return {
      saved: r?.saved ?? false,
      helped: r?.helped ?? false,
      finished: r?.finishedAt !== undefined,
      position: r?.position ?? null,
      helpedCount: helpedCount >= HELPED_FLOOR ? helpedCount : null,
    };
  },
});

/**
 * The one write. `opened` is the reader opening: the first one is the view,
 * later ones never count again — and saving from a card isn't a view.
 * `finished` is one-way — the reader decides it (end reached + dwell), never
 * a button.
 */
export const record = mutation({
  args: {
    entryId: v.id("library_entries"),
    opened: v.optional(v.literal(true)),
    position: v.optional(v.number()),
    finished: v.optional(v.literal(true)),
    saved: v.optional(v.boolean()),
    helped: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const entry = await ctx.db.get("library_entries", args.entryId);
    if (!entry) throw new Error("Library entry not found");

    let row: Doc<"library_reads"> | null = await readRow(ctx, profile._id, args.entryId);
    if (!row) {
      // A retracted entry only stays open to its existing readers — a new row would unlock it in getEntry.
      if (!entry.active) throw new Error("Library entry not found");
      const id = await ctx.db.insert("library_reads", {
        emotionalProfileId: profile._id,
        entryId: args.entryId,
        saved: false,
        helped: false,
      });
      row = (await ctx.db.get("library_reads", id))!;
    }

    // Read-only once retracted (#404): no new view, save or helped — only the
    // reader's private progress, and unsaving. Dropped, not thrown: the reader
    // sends `opened` on every open.
    if (!entry.active) {
      const { entryId, position, finished, saved } = args;
      args = { entryId, position, finished, saved: saved === false ? false : undefined };
    }

    const patch: Partial<Doc<"library_reads">> = {};
    if (args.opened && row.viewedAt === undefined) {
      patch.viewedAt = Date.now();
      await bumpTotals(ctx, args.entryId, { views: 1 });
    }
    if (args.position !== undefined) patch.position = Math.min(Math.max(args.position, 0), 1);
    if (args.finished && row.finishedAt === undefined) patch.finishedAt = Date.now();
    if (args.saved !== undefined) patch.saved = args.saved;
    if (args.helped !== undefined && args.helped !== row.helped) {
      patch.helped = args.helped;
      await bumpTotals(ctx, args.entryId, { helped: args.helped ? 1 : -1 });
    }
    if (Object.keys(patch).length > 0) await ctx.db.patch("library_reads", row._id, patch);
    return null;
  },
});
