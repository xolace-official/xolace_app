import type { MoodItem } from '@/components/onboarding/mood-card';

/**
 * Mood cards for the onboarding marquee.
 * Each mood represents a feeling someone might carry to Xolace.
 * Colors are muted, warm gradients — twilight palette, not clinical.
 */
export const MOODS: MoodItem[] = [
  {
    id: 1,
    word: 'heavy',
    colors: ['#2d2340', '#3b2f5c', '#1e1a2e'],
  },
  {
    id: 2,
    word: 'anxious',
    colors: ['#3a2c3f', '#4e3658', '#2a1f35'],
  },
  {
    id: 3,
    word: 'numb',
    colors: ['#1f2937', '#2b3544', '#171e28'],
  },
  {
    id: 4,
    word: 'restless',
    colors: ['#3b2f1f', '#4a3a28', '#2a2118'],
  },
  {
    id: 5,
    word: 'confused',
    colors: ['#2a2842', '#3d3558', '#1d1b30'],
  },
  {
    id: 6,
    word: 'overwhelmed',
    colors: ['#32283a', '#443550', '#221c2a'],
  },
  {
    id: 7,
    word: 'uncertain',
    colors: ['#252d3a', '#31394a', '#1a2028'],
  },
  {
    id: 8,
    word: 'lost',
    colors: ['#2e2535', '#3f3048', '#1f1a25'],
  },
];
