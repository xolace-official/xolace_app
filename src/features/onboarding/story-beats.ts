/**
 * The six beats of the onboarding tale, in order. Form locked by #198 (a
 * six-beat tale, no card, ember-led chapter marks), content by #200.
 *
 * Copy rule inherited from the product: NOTHING here may be a number or a
 * quote we cannot defend. The cohort figure on the `proof` beat is the real
 * shipped mechanic (>= 3 matches or no number at all), never a decorative
 * stat.
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
  /** ms this beat holds before auto-advancing. */
  duration: number;
  /**
   * 'tale' (default) = words on the dark, as #198 decided.
   * 'proof'          = the odd one out: a real artifact in a contained well.
   * 'cover'          = the opening title card. Not a slide in the deck's
   *                    rhythm — the front of the book, so it breaks the grid
   *                    on purpose (see `cover-beat.tsx`).
   */
  kind?: 'tale' | 'proof' | 'cover';
  /** Ember-cased footnote under the aside. Only Xolace+ carries one. */
  tag?: string;
};

export const STORY_BEATS: StoryBeat[] = [
  {
    id: 'dusk',
    kind: 'cover',
    // The gateway into the brand, so it is the one beat that must NAME the
    // thing: the wordmark, the word "campfire", and in plain language what
    // actually happens here. Every later beat may lean on the metaphor
    // because this one paid for it. Nothing poetic gets to go first.
    beat: 'A campfire for\nwhat you can’t\nsay out loud.',
    aside: 'Low light, not a spotlight. Voices before faces. A fire nobody owns.',
    symbol: { ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' },
    duration: 3400,
  },
  {
    id: 'vent',
    label: 'Vent',
    beat: 'So you say it.\nOut loud.',
    aside: 'Your voice, never stored. It goes when you close it.',
    symbol: { ios: 'mic', android: 'mic', web: 'mic' },
    duration: 3600,
  },
  {
    id: 'mirror',
    label: 'The Mirror',
    beat: 'And something\nsays it back.',
    aside: 'Not advice. The shape of what you said, held where you can see it.',
    symbol: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
    duration: 3800,
  },
  {
    id: 'proof',
    label: 'This week',
    kind: 'proof',
    beat: "You're not the\nonly one out here.",
    aside: 'Counted from real sessions this week. Never a number we made up.',
    symbol: { ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' },
    duration: 4200,
  },
  {
    id: 'xolacers',
    label: 'Xolacers',
    beat: 'And if you want\na person, there\nis a person.',
    aside: 'A real volunteer, by name. You stay anonymous the whole way.',
    symbol: { ios: 'person.2', android: 'group', web: 'group' },
    duration: 3800,
  },
  {
    id: 'plus',
    label: 'Xolace+',
    // The last beat before the ask, so it is the one spot in the tale built to
    // plant the offer — concrete about what Plus is, and that it never gates
    // the free product.
    beat: 'The fire\nstays lit for you.',
    aside:
      'Full history, your mirror in its own voice, a line that’s really yours each day. Free to start — Xolace+ is there when you want more.',
    tag: 'Founding pricing · while it lasts',
    symbol: { ios: 'flame.circle', android: 'local_fire_department', web: 'local_fire_department' },
    duration: 3400,
  },
];
