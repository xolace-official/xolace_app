import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import { earnFreeze, settleStreak } from "./state";

export type ActivityActionType = Doc<"activity_log">["actionType"];

// Weight is derived here, at read time, not stored on the row — re-weighting
// an action type later needs no backfill. `quotes` is logged but zero-weight:
// it never extends a streak on its own (decision log, #423).
export const ACTION_WEIGHTS: Record<ActivityActionType, number> = {
  reflect: 1,
  vent: 1,
  library: 1,
  sit_with_this: 1,
  daily_mood: 1,
  quotes: 0,
};

/**
 * Local calendar day ("YYYY-MM-DD") for a timestamp in an IANA timezone.
 * Falls back to UTC if the timezone string is invalid (e.g. stale client data).
 */
export function localDayKey(timestampMs: number, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(timestampMs));
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(timestampMs));
  }
}

/**
 * Single write path for streak-affecting events. Upserts the (profile, local
 * day, action type) log row, then keeps the deprecated currentStreak /
 * longestStreak mirror on emotional_profiles in sync — old app binaries still
 * read those directly (Deferred Deprecations, CLAUDE.md) — and bumps
 * lastSessionAt on reflect only.
 *
 * Called directly by every qualifying action's mutation (same transaction,
 * no nested ctx.runMutation).
 */
export async function recordActivity(
  ctx: MutationCtx,
  args: {
    emotionalProfileId: Id<"emotional_profiles">;
    actionType: ActivityActionType;
    timestamp?: number;
  },
): Promise<void> {
  const profile = await ctx.db.get("emotional_profiles", args.emotionalProfileId);
  if (!profile) return;

  const now = args.timestamp ?? Date.now();
  // Bridge any gap a freeze covers first, so an action the day after a frozen
  // day reads that day as yesterday. The last covered dayKey comes off its own
  // persisted row — never recomputed from lastSessionAt under whatever
  // timezone is active now.
  const state = await settleStreak(ctx, profile, now);
  const dayKey = localDayKey(now, state.timezone);
  const previousDayKey = state.lastCoveredDay;

  const existing = await ctx.db
    .query("activity_log")
    .withIndex("by_profile_day_action", (q) =>
      q
        .eq("emotionalProfileId", args.emotionalProfileId)
        .eq("dayKey", dayKey)
        .eq("actionType", args.actionType),
    )
    .unique();

  if (existing) {
    await ctx.db.patch("activity_log", existing._id, {
      count: existing.count + 1,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("activity_log", {
      emotionalProfileId: args.emotionalProfileId,
      dayKey,
      actionType: args.actionType,
      count: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Zero-weight actions (quotes) log history but never touch the streak.
  if (ACTION_WEIGHTS[args.actionType] === 0) return;

  // expectedPrevious gap check on day keys (#426): yesterday → +1, today →
  // unchanged, otherwise reset. A dayKey *behind* the last one (timezone moved
  // west, or a backdated timestamp) counts as "today" — past days stand and
  // are never double-counted. Floor at 1: this day now has a qualifying row.
  let newStreak: number;
  let freezes = state.freezes;
  if (previousDayKey === undefined) {
    newStreak = 1;
  } else if (dayKey <= previousDayKey) {
    newStreak = Math.max(profile.currentStreak, 1);
  } else if (previousDayKey === shiftDayKey(dayKey, -1)) {
    newStreak = profile.currentStreak + 1;
    freezes = await earnFreeze(ctx, profile, dayKey, newStreak, freezes);
  } else {
    newStreak = 1;
  }

  const newLongestStreak = Math.max(newStreak, profile.longestStreak ?? profile.currentStreak);

  await ctx.db.patch("emotional_profiles", args.emotionalProfileId, {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    streakFreezes: freezes,
    // lastSessionAt keeps meaning "last completed reflect" (#426) — nudges,
    // Return Welcome and plus-offers read it. Never moves backward.
    ...(args.actionType === "reflect" && {
      lastSessionAt: Math.max(now, profile.lastSessionAt ?? 0),
    }),
    updatedAt: now,
  });
}

/** "YYYY-MM-DD" shifted by whole calendar days (DST-free: pure date math). */
export function shiftDayKey(dayKey: string, days: number): string {
  const date = new Date(`${dayKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
