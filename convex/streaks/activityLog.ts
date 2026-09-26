import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import { isStreakExpired } from "../lib/streak";

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
 * longestStreak / lastSessionAt mirror on emotional_profiles in sync — old
 * app binaries still read those directly (Deferred Deprecations, CLAUDE.md).
 *
 * No production call sites yet (#432) — this is the shared core other
 * mutations will call directly (same transaction, no nested ctx.runMutation).
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
  const preferences = await ctx.db
    .query("preferences")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", args.emotionalProfileId))
    .unique();
  const timezone = preferences?.notifications.timezone ?? "UTC";
  const dayKey = localDayKey(now, timezone);

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

  const previousDayKey = profile.lastSessionAt
    ? localDayKey(profile.lastSessionAt, timezone)
    : undefined;

  let newStreak: number;
  if (!profile.lastSessionAt || isStreakExpired(profile.lastSessionAt, now)) {
    newStreak = 1;
  } else if (previousDayKey === dayKey) {
    newStreak = profile.currentStreak; // same local day — no increment
  } else {
    newStreak = profile.currentStreak + 1;
  }

  const newLongestStreak = Math.max(newStreak, profile.longestStreak ?? profile.currentStreak);

  await ctx.db.patch("emotional_profiles", args.emotionalProfileId, {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastSessionAt: now,
    updatedAt: now,
  });
}
