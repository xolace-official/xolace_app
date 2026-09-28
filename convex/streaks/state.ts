import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { mutation, MutationCtx, QueryCtx } from "../_generated/server";
import { requireAuth } from "../lib/auth";
import { ACTION_WEIGHTS, localDayKey, shiftDayKey } from "./activityLog";

/** Freezes on hand never exceed this. Xolace+ may raise it later (#427). */
export const FREEZE_CAP = 2;
/** One freeze is earned per this many consecutive qualifying days. */
export const FREEZE_EARN_EVERY = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Freezes after acting on `dayKey` extends the streak to `streak`: +1 per
 * FREEZE_EARN_EVERY consecutive *qualifying* days, capped. Strict: a frozen day
 * restarts the count, so a bridged week doesn't earn. currentStreak counts
 * qualifying days only, so the run since the last frozen day is the smaller of
 * the streak and the days elapsed since it (a frozen day from an older, lapsed
 * streak is further back than the streak itself).
 */
export async function earnFreeze(
  ctx: QueryCtx,
  profile: Doc<"emotional_profiles">,
  dayKey: string,
  streak: number,
  freezes: number,
): Promise<number> {
  const lastFrozen = (
    await ctx.db
      .query("frozen_days")
      .withIndex("by_profile_day", (q) => q.eq("emotionalProfileId", profile._id))
      .order("desc")
      .first()
  )?.dayKey;
  const run =
    lastFrozen === undefined ? streak : Math.min(streak, (Date.parse(dayKey) - Date.parse(lastFrozen)) / DAY_MS);
  return run > 0 && run % FREEZE_EARN_EVERY === 0 ? Math.min(freezes + 1, FREEZE_CAP) : freezes;
}

export type StreakState = {
  /** Streak to show: the stored count, or 0 once the gap outruns the freezes. */
  streak: number;
  /** Freezes left after bridging `bridge`. */
  freezes: number;
  /** Last qualifying or frozen local day — the day the gap check runs from. */
  lastCoveredDay: string | undefined;
  /** Missed days a freeze covers on settle, oldest first. */
  bridge: string[];
  timezone: string;
};

/**
 * The one freeze-aware read of streak state (#434). Every streak consumer —
 * display queries, recordActivity, future notification crons — goes through
 * this, so no surface can disagree with another about whether a streak is lit.
 *
 * Expiry runs off the last qualifying activity_log dayKey (or frozen day), not
 * lastSessionAt: that keeps meaning "last completed reflect" (#426), and a
 * vent/library/twig day extends the streak without moving it.
 *
 * Read-only. `settleStreak` persists the bridge; until then every read derives
 * the same answer, so the two can't drift.
 */
export async function streakState(
  ctx: QueryCtx,
  profile: Doc<"emotional_profiles">,
  now: number = Date.now(),
): Promise<StreakState> {
  const preferences = await ctx.db
    .query("preferences")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profile._id))
    .unique();
  const timezone = preferences?.notifications.timezone ?? "UTC";
  const today = localDayKey(now, timezone);
  const freezes = profile.streakFreezes ?? 0;

  // At most 6 log rows per day, so 20 always reaches back past the days a
  // capped freeze budget can bridge.
  const recentLogs = await ctx.db
    .query("activity_log")
    .withIndex("by_profile_day_action", (q) => q.eq("emotionalProfileId", profile._id))
    .order("desc")
    .take(20);
  // No qualifying row yet: a profile the cutover hasn't reached, whose only
  // qualifying action was reflect — lastSessionAt's day is what it would seed.
  const lastQualifying =
    recentLogs.find((log) => ACTION_WEIGHTS[log.actionType] > 0)?.dayKey ??
    (profile.lastSessionAt === undefined ? undefined : localDayKey(profile.lastSessionAt, timezone));
  const lastFrozen = (
    await ctx.db
      .query("frozen_days")
      .withIndex("by_profile_day", (q) => q.eq("emotionalProfileId", profile._id))
      .order("desc")
      .first()
  )?.dayKey;
  const lastCoveredDay =
    lastFrozen !== undefined && (lastQualifying === undefined || lastFrozen > lastQualifying)
      ? lastFrozen
      : lastQualifying;

  const lapsed = { streak: 0, freezes, lastCoveredDay, bridge: [], timezone };
  // A freeze bridges from an existing streak; it never starts one.
  if (lastCoveredDay === undefined || profile.currentStreak === 0) return lapsed;

  // Negative when the timezone moved west past the last covered day: still lit.
  const missed = (Date.parse(today) - Date.parse(lastCoveredDay)) / DAY_MS - 1;
  if (missed > freezes) return lapsed;

  const bridge: string[] = [];
  for (let i = 1; i <= missed; i++) bridge.push(shiftDayKey(lastCoveredDay, i));
  return { streak: profile.currentStreak, freezes: freezes - bridge.length, lastCoveredDay, bridge, timezone };
}

/**
 * streakState, then persist its bridge: one frozen_days row per covered day,
 * one freeze spent per row. Idempotent — once bridged, the gap is gone.
 * Returns the state as it stands after settling.
 */
export async function settleStreak(
  ctx: MutationCtx,
  profile: Doc<"emotional_profiles">,
  now: number = Date.now(),
): Promise<StreakState> {
  const state = await streakState(ctx, profile, now);
  if (state.bridge.length === 0) return state;

  for (const dayKey of state.bridge) {
    await ctx.db.insert("frozen_days", { emotionalProfileId: profile._id, dayKey, createdAt: now });
  }
  await ctx.db.patch("emotional_profiles", profile._id, { streakFreezes: state.freezes, updatedAt: now });
  return { ...state, lastCoveredDay: state.bridge[state.bridge.length - 1], bridge: [] };
}

/** App open: the read-time recompute that makes a bridged gap durable. */
export const settle = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    await settleStreak(ctx, profile);
    return null;
  },
});
