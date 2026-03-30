import type { UserVariant } from '@/src/interfaces/reflection';

type ProfileFields = {
  sessionCount: number;
  currentStreak: number;
  lastSessionAt?: number;
};

const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;

export function computeUserVariant(profile: ProfileFields): UserVariant {
  if (profile.sessionCount === 0) {
    return { kind: 'first-time' };
  }

  const streakExpired =
    !profile.lastSessionAt ||
    Date.now() - profile.lastSessionAt > STREAK_WINDOW_MS;

  if (streakExpired) {
    return { kind: 'returning' };
  }

  return { kind: 'active', dayCount: profile.currentStreak };
}
