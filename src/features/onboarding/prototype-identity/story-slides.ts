/**
 * PROTOTYPE — throwaway. Ticket #200 (content), on #198's variant-E shell.
 *
 * #198 locked the FORM: a six-beat tale in order, no card, ember-led chapter
 * marks. This file is the CONTENT decision — which features get a beat, what
 * each one says, and what it looks like.
 *
 * Three changes from #198's placeholder beats:
 *
 * 1. `kind: 'proof'` — one beat deliberately breaks the shape. Every other beat
 *    is words on the dark; this one is a real in-app artifact (the weekly
 *    cohort card) held up in a well. It sits at position 4 so the rhythm breaks
 *    after you have learned it, and before the ask.
 * 2. Xolacers now means what it means in-product: a NAMED volunteer listener in
 *    a 1:1 conversation, with you anonymous as `Camper XXXX`. #198's beat
 *    described peer reflections instead. The "you are not the only one" job
 *    moved to the proof beat, which does it with a real number.
 * 3. Quotes lost its standalone beat — see the ticket. Seven beats made the
 *    tale a list; the line you carry away is Xolace+'s aside now.
 *
 * Copy rule inherited from the product: NOTHING here may be a number or a
 * quote we cannot defend. The cohort figure is the real shipped mechanic
 * (>= 3 matches or no number at all), never a decorative stat.
 */
import type { SymbolViewProps } from 'expo-symbols';

export type StoryBeat = {
  id: string;
  /** Chapter marker — absent on the opening beat, which sells nothing. */
  label?: string;
  /** The narration. Second person, present tense, continues from the last beat. */
  beat: string;
  /** What it actually is, once the sentence has landed. */
  aside: string;
  symbol: SymbolViewProps['name'];
  /** ms this beat holds before auto-advancing (superlist's slide duration). */
  duration: number;
  /**
   * 'tale' (default) = words on the dark, as #198 decided.
   * 'proof'          = the odd one out: a real artifact in a contained well.
   */
  kind?: 'tale' | 'proof';
};

export const STORY_BEATS: StoryBeat[] = [
  {
    id: 'dusk',
    beat: "It's late,\nand it's still there.",
    aside: 'The thing you carried all day and never said out loud.',
    symbol: 'moon.stars',
    duration: 3400,
  },
  {
    id: 'vent',
    label: 'Vent',
    beat: 'So you say it.\nOut loud.',
    aside: 'Your voice, never stored. It goes when you close it.',
    symbol: 'mic',
    duration: 3600,
  },
  {
    id: 'mirror',
    label: 'The Mirror',
    beat: 'And something\nsays it back.',
    aside: 'Not advice. The shape of what you said, held where you can see it.',
    symbol: 'sparkles',
    duration: 3800,
  },
  {
    id: 'proof',
    label: 'This week',
    kind: 'proof',
    beat: "You're not the\nonly one out here.",
    aside: 'Counted from real sessions this week. Never a number we made up.',
    symbol: 'flame',
    duration: 4200,
  },
  {
    id: 'xolacers',
    label: 'Xolacers',
    beat: 'And if you want\na person, there\nis a person.',
    aside: 'A real volunteer, by name. You stay anonymous the whole way.',
    symbol: 'person.2',
    duration: 3800,
  },
  {
    id: 'plus',
    label: 'Xolace+',
    beat: 'The fire\nstays lit.',
    aside: 'Your patterns, your mirror’s voice, a line each day that came from you.',
    symbol: 'flame.circle',
    duration: 3400,
  },
];
