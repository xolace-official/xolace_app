/**
 * PROTOTYPE — throwaway. Ticket #198, variants D & E.
 *
 * Separate from `slides.ts` on purpose: variants A/B/C are locked, and this is
 * a different content SHAPE, not just different copy. A/B/C present five
 * features as a menu. This is a tale told in order — the beats only make sense
 * read start to finish, so a slide carries `beat` (the narration) and
 * `aside` (what the product actually does), and the first beat sells nothing.
 *
 * Vent and Mirror are deliberately separate beats: Vent is VOICE ONLY, the
 * Mirror is what comes back. Collapsing them loses the turn in the story.
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
    aside: 'Your voice, nothing typed. Nobody is listening on the other end.',
    symbol: 'mic',
    duration: 3600,
  },
  {
    id: 'mirror',
    label: 'The Mirror',
    beat: 'And something\nsays it back.',
    aside: 'Not advice. The shape of what you said, held where you can see it.',
    symbol: 'sparkles',
    duration: 3600,
  },
  {
    id: 'xolacers',
    label: 'Xolacers',
    beat: "Then you look up.\nYou're not the\nonly one out here.",
    aside: 'Other people at their own fires. Anonymous. Some have felt exactly this.',
    symbol: 'person.2',
    duration: 3800,
  },
  {
    id: 'quotes',
    label: 'Quotes',
    beat: 'You take one line\nwith you.',
    aside: 'Small enough to carry into tomorrow.',
    symbol: 'quote.opening',
    duration: 3200,
  },
  {
    id: 'plus',
    label: 'Xolace+',
    beat: 'And the fire\nstays lit.',
    aside: 'For as long as you want to keep sitting here.',
    symbol: 'flame',
    duration: 3400,
  },
];
