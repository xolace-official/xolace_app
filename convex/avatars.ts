import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";

const tierValidator = v.union(v.literal("free"), v.literal("premium"));

// Premium stub — mirrors profile.ts. Swap for hasEntitlement() when
// RevenueCat lands. Gated server-side so a plus avatar can never be
// selected by a non-entitled client.
function hasPremium(): boolean {
  return false;
}

/**
 * The curated avatar catalog, free tier first (tier "free" < "premium").
 * `url` is denormalized on the row, so this is a plain bounded read —
 * no per-request storage URL resolution.
 */
export const listAvatars = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("avatars").withIndex("by_tier_order").take(50);
    return rows.map((a) => ({
      key: a.key,
      tier: a.tier,
      label: a.label,
      order: a.order,
      isDefault: a.isDefault,
      url: a.url,
    }));
  },
});

/**
 * Set the authenticated user's avatar to a catalog key.
 * Validates the key exists and enforces the tier gate server-side.
 */
export const setAvatar = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const avatar = await ctx.db
      .query("avatars")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (!avatar) throw new Error(`Unknown avatar: ${args.key}`);

    if (avatar.tier === "premium" && !hasPremium()) {
      throw new Error("This avatar requires Xolace+");
    }

    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profile._id))
      .unique();
    if (!prefs) throw new Error("Preferences not found");

    await ctx.db.patch(prefs._id, { avatarId: args.key });
    return null;
  },
});

/**
 * Seed (or update) one catalog row. INTERNAL — run from the dashboard
 * Functions panel / `npx convex run`, once per avatar, per environment.
 *
 * Flow: upload the image in the dashboard Files tab → copy its storage
 * id → call this with that id + metadata. The URL is resolved here from
 * the storageId so the denormalized `url` always matches the file.
 *
 * Upserts by `key`, so swapping an avatar's image later = re-run with the
 * new storageId; no duplicate rows.
 */
export const seedAvatar = internalMutation({
  args: {
    key: v.string(),
    tier: tierValidator,
    label: v.string(),
    order: v.number(),
    isDefault: v.boolean(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error(`No file for storageId ${args.storageId}`);

    const existing = await ctx.db
      .query("avatars")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const doc = { ...args, url };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
    } else {
      await ctx.db.insert("avatars", doc);
    }
    return null;
  },
});
