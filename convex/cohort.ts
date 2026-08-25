import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import {
  deriveCohortCardState,
  isCohortEmotion,
  isCohortMatch,
} from "./lib/cohortCard";

const HIDDEN = { status: "hidden" as const };

/**
 * The Discovery cohort card's only read: how many OTHER campers carried the
 * same emotion the viewer last carried, over the most recently closed calendar
 * week. Reads one materialized row (jobs/cohortCounts.ts) — nothing is counted
 * live here.
 *
 * Three shapes, mirroring `getReflectionRank`'s withhold-don't-fabricate gate:
 *   hidden  — nothing honest to say (no classified session, or no week counted yet)
 *   warming — below the floor; the reassurance line runs without a number
 *   count   — a real number of real other people
 */
export const getWeeklyCohortCard = query({
  args: {},
  returns: v.union(
    v.object({ status: v.literal("hidden") }),
    v.object({ status: v.literal("warming"), emotion: v.string() }),
    v.object({
      status: v.literal("count"),
      emotion: v.string(),
      count: v.number(),
      weekStart: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    // The viewer's own most recent classified session decides which cohort
    // they're shown. No session, no card — never a generic stat.
    const latest = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_createdAt", (q) =>
        q.eq("emotionalProfileId", profile._id),
      )
      .order("desc")
      .first();

    if (!latest) return HIDDEN;

    const emotion = latest.primaryEmotion;
    // A label outside the taxonomy (an older classifier version, say) has no
    // column in the aggregate. Nothing to say rather than something wrong.
    if (!isCohortEmotion(emotion)) return HIDDEN;

    const week = await ctx.db
      .query("cohort_weekly_counts")
      .withIndex("by_weekStart")
      .order("desc")
      .first();

    if (!week) return HIDDEN;

    const total = week.counts[emotion] ?? 0;

    // Self-exclusion, applied here rather than in the aggregate because the
    // aggregate row is shared by every viewer carrying this emotion. The count
    // is of distinct campers, so the viewer is worth at most one — check
    // whether they were one of them at all, not just their newest session.
    const ownRows = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_createdAt", (q) =>
        q
          .eq("emotionalProfileId", profile._id)
          .gte("createdAt", week.weekStart)
          .lt("createdAt", week.weekEnd),
      )
      .take(50);

    const countedSelf = ownRows.some((r) => isCohortMatch(r, undefined, emotion));
    const others = Math.max(total - (countedSelf ? 1 : 0), 0);

    const state = deriveCohortCardState(others);
    if (state.type === "warming") return { status: "warming" as const, emotion };

    return {
      status: "count" as const,
      emotion,
      count: state.value,
      weekStart: week.weekStart,
    };
  },
});
