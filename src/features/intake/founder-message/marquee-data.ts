import type { FounderCardShape } from './clip-paths';

// Reuses the onboarding twilight imagery — real, on-brand, no network. One card
// per shape, no duplicates (#236). Frame colours are theme tokens, never hex, so
// the band re-tints with the active theme.

export type FounderMarqueeCard = {
  id: string;
  /** Metro `require()` asset id — accepted by both Skia `useImage` and expo-image. */
  image: number;
  /** Uniwind background class for the card frame. */
  frameClassName: string;
  shape: FounderCardShape;
};

export const FOUNDER_MARQUEE_CARDS: FounderMarqueeCard[] = [
  {
    id: 'heavy',
    image: require('@/assets/images/onboarding/heavy-mini.jpeg'),
    frameClassName: 'bg-tone-poetic/70',
    shape: 'roundedRect',
  },
  {
    id: 'anxious',
    image: require('@/assets/images/onboarding/Anxious-mini.jpeg'),
    frameClassName: 'bg-tone-gentle/70',
    shape: 'portal',
  },
  {
    id: 'numb',
    image: require('@/assets/images/onboarding/numb-mini.jpeg'),
    frameClassName: 'bg-tone-direct/70',
    shape: 'blob',
  },
  {
    id: 'restless',
    image: require('@/assets/images/onboarding/restless-mini.jpeg'),
    frameClassName: 'bg-ember/70',
    shape: 'flower',
  },
  {
    id: 'lost',
    image: require('@/assets/images/onboarding/Lost-mini.jpeg'),
    frameClassName: 'bg-tone-witnessed/70',
    shape: 'circle',
  },
];
