/**
 * Clock-driven copy for the discovery masthead. Pure functions, no state —
 * the screen re-renders on focus, which is often enough for a day part.
 */

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'late';

export function getDayPart(now = new Date()): DayPart {
  const hour = now.getHours();
  if (hour < 5) return 'late';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'late';
}

/** Eyebrow datestamp — "Tuesday · evening". Rendered uppercase + tracked. */
export function getDateStamp(now = new Date()): string {
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  return `${weekday} · ${getDayPart(now)}`;
}

/** Quiet, non-time-worded greeting so it doesn't echo the eyebrow above it. */
export function getGreeting(firstName?: string | null): string {
  return firstName ? `Welcome back, ${firstName}` : 'Welcome back';
}

/**
 * Xolacer invitation lines. One is live; swap the index to try another.
 * Split lead/tail so the masthead can drop the tail to a lighter weight —
 * the reference's trick for giving a type block internal rhythm.
 */
export const XOLACER_LINES = [
  'Be the support someone needs.',
  'Listen. Connect. Support.',
  'Your story, your empathy, your impact.',
  'Make space for someone to be heard.',
  'Someone needs a safe space. You could help create it.',
] as const;

export const XOLACER_LEAD = XOLACER_LINES[3];
export const XOLACER_TAIL = 'Become a Xolacer.';
