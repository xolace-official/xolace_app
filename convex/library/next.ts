import { v } from "convex/values";
import { query } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { requireAuth } from "../lib/auth";
import { cardItemValidator, entryIdsWithFacet, toListItem } from "./entries";
import { cardSignals, readRow } from "./reads";

/**
 * The "Up next" card at the end of a read (#417). A rule, no model call
 * (Constitution Rule): from a hub, the next active entry in the hub's order;
 * otherwise (or past the hub's last entry) the first active entry sharing
 * this one's primary subject that the reader hasn't finished. Nothing
 * qualifies → null, never padded. Inactive entries are never offered.
 */
export const getNext = query({
  args: { entryId: v.id("library_entries"), hub: v.optional(v.string()) },
  returns: v.union(v.null(), cardItemValidator),
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const current = await ctx.db.get("library_entries", args.entryId);
    if (!current) return null;
    const card = async (e: Doc<"library_entries">) => ({
      ...toListItem(e),
      ...(await cardSignals(ctx, profile._id, e._id)),
    });

    const { hub: hubSlug } = args;
    if (hubSlug) {
      const hub = await ctx.db
        .query("library_hubs")
        .withIndex("by_slug", (q) => q.eq("slug", hubSlug))
        .unique();
      if (hub?.active) {
        const ids = hub.items.flatMap((i) => (i.kind === "entry" ? [i.entryId] : []));
        const at = ids.indexOf(args.entryId);
        if (at >= 0) {
          for (const id of ids.slice(at + 1)) {
            const e = await ctx.db.get("library_entries", id);
            if (e?.active) return await card(e);
          }
        }
      }
    }

    for (const id of await entryIdsWithFacet(ctx, "subject", current.primarySubject)) {
      if (id === current._id) continue;
      const e = await ctx.db.get("library_entries", id);
      if (!e?.active || e.primarySubject !== current.primarySubject) continue;
      const r = await readRow(ctx, profile._id, id);
      if (r?.finishedAt === undefined) return await card(e);
    }
    return null;
  },
});
