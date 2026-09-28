/**
 * Streak milestone cadence (#435): 7, 30, 100, then every 100 after. The one
 * table both streak-saver earning and milestone notifications (#439) read.
 */
export const STREAK_MILESTONES = [7, 30, 100] as const;
/** Past the last fixed milestone, one lands every this many days. */
export const STREAK_MILESTONE_EVERY = 100;

export function isStreakMilestone(streak: number): boolean {
  const last = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  return (
    (STREAK_MILESTONES as readonly number[]).includes(streak) ||
    (streak > last && streak % STREAK_MILESTONE_EVERY === 0)
  );
}
