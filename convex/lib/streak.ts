/**
 * Streak window shared between the write path (jobs/profileStats.ts) and the
 * read path (profile.ts:getSummary).
 *
 * `currentStreak` is denormalized on emotional_profiles and only rewritten when
 * a session completes. Without a live check, an expired streak stays stale on
 * any surface that reads the stored value directly (e.g. the profile StatBand).
 * Derive expiry at read time using the same window the writer resets against so
 * the profile screen never disagrees with the home screen.
 *
 * Mirrors the client-side window in src/helpers/utils/user-variant.ts — keep
 * the two in sync (RN bundle can't import from convex/).
 */
export const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;

/** A streak is expired once the gap since the last session exceeds the window. */
export function isStreakExpired(
  lastSessionAt: number | undefined,
  now: number = Date.now(),
): boolean {
  return !lastSessionAt || now - lastSessionAt > STREAK_WINDOW_MS;
}

/** Streak to display: the stored value, or 0 if the window has lapsed. */
export function displayStreak(
  currentStreak: number,
  lastSessionAt: number | undefined,
  now: number = Date.now(),
): number {
  return isStreakExpired(lastSessionAt, now) ? 0 : currentStreak;
}
