// PROTOTYPE — throwaway (#429). Fake activity log shaped like #426's rows.
import { addDays, startOfDay } from '@/src/lib/date';

export type ActionType = 'reflect' | 'vent' | 'library' | 'twig' | 'mood' | 'quote';
export const FULL_CREDIT: ActionType[] = ['reflect', 'vent', 'library', 'twig', 'mood'];

export interface MockDay {
  date: Date;
  counts: Partial<Record<ActionType, number>>;
  frozen: boolean;
}

// Deterministic so every reload looks the same.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

const PROB: Record<ActionType, number> = {
  reflect: 0.4, vent: 0.12, library: 0.18, twig: 0.06, mood: 0.45, quote: 0.3,
};

export function mockYear(): MockDay[] {
  const rand = rng(429);
  const today = startOfDay(new Date());
  const days: MockDay[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = addDays(today, -i);
    // Quieter first months, a lapse mid-year, busier lately.
    const drive = i > 250 ? 0.4 : i > 150 && i < 180 ? 0.1 : i < 60 ? 1.3 : 0.9;
    const counts: MockDay['counts'] = {};
    for (const type of Object.keys(PROB) as ActionType[]) {
      if (rand() < PROB[type] * drive) counts[type] = 1 + Math.floor(rand() * (type === 'reflect' ? 3 : 1.5));
    }
    days.push({ date, counts, frozen: false });
  }
  // A few single-day gaps bridged by a freeze (#427): no log row, frozen record instead.
  for (const back of [3, 19, 44, 97]) {
    const day = days[days.length - 1 - back]!;
    day.counts = {};
    day.frozen = true;
  }
  return days;
}

export function fullCreditCount(day: MockDay) {
  return FULL_CREDIT.reduce((sum, type) => sum + (day.counts[type] ?? 0), 0);
}

/** Breadth: distinct full-credit kinds that day (#429 decision). */
export function breadth(day: MockDay) {
  return FULL_CREDIT.filter((type) => (day.counts[type] ?? 0) > 0).length;
}

export function breakdown(day: MockDay) {
  const parts = (Object.keys(day.counts) as ActionType[]).map((type) => `${day.counts[type]} ${type}`);
  return parts.length ? parts.join(' · ') : day.frozen ? 'Frozen — streak held' : 'Nothing';
}

export function currentStreak(days: MockDay[]) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]!;
    if (day.frozen) continue; // bridges, never counts
    if (fullCreditCount(day) === 0) {
      if (i === days.length - 1) continue; // today not done yet
      break;
    }
    streak++;
  }
  return streak;
}
