import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "../_generated/api";
import { DataModel, Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

/**
 * Sorted index over `emotional_profiles.sessionCount`.
 *
 * Powers the percentile card ("you've sat with more moments than 73% of
 * people here") without scanning the profiles table: rank and population are
 * both O(log n) reads.
 *
 * INVARIANT: every write to `emotional_profiles.sessionCount` — insert, patch,
 * or delete — must go through the sync helpers below, or the aggregate silently
 * drifts from the table and every user's percentile is wrong. There are four
 * such write sites today (users.getOrCreate, jobs/profileStats,
 * jobs/dataWipe, jobs/accountDeletion). If that grows much past a handful,
 * switch to convex-helpers Triggers so the sync can't be forgotten.
 */
export const reflectionRank = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "emotional_profiles";
}>(components.reflectionRank, {
  sortKey: (doc) => doc.sessionCount,
});

/** Call immediately after inserting a new emotional_profiles row. */
export async function rankInsert(ctx: MutationCtx, profileId: Id<"emotional_profiles">) {
  const doc = await ctx.db.get(profileId);
  if (doc) await reflectionRank.insert(ctx, doc);
}

/**
 * Call immediately after patching a profile, passing the doc as it was read
 * *before* the patch. Re-reads the fresh doc itself.
 */
export async function rankReplace(ctx: MutationCtx, oldDoc: Doc<"emotional_profiles">) {
  const newDoc = await ctx.db.get(oldDoc._id);
  if (newDoc) await reflectionRank.replace(ctx, oldDoc, newDoc);
}

/** Call *before* deleting the profile row — the doc must still exist. */
export async function rankDelete(ctx: MutationCtx, profileId: Id<"emotional_profiles">) {
  const doc = await ctx.db.get(profileId);
  if (doc) await reflectionRank.delete(ctx, doc);
}
