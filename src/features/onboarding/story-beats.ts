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
   * 'mirror'         = owns its own composition too: figure over a waterline
   *                    with its own reflection (see `mirror-beat.tsx`).
   * 'vent'           = the mirror's inversion: figure on the other side of the
   *                    axis, breath rising instead of a reflection falling
   *                    (see `vent-beat.tsx`).
   * 'xolacers'       = the only beat with someone else in it: figure on the
   *                    axis, another person's ember across the dark
   *                    (see `xolacers-beat.tsx`).
   */
  kind?: 'tale' | 'proof' | 'cover' | 'mirror' | 'vent' | 'xolacers';
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
  // Mirror and Vent are a MATCHED PAIR, not two steps of one flow. They are
  // alternatives — different reasons to open the app on a given night — so the
  // two beats are written in identical grammatical shape ("Some nights… /
  // Other nights…"). Same form reads as a choice; different form would read as
  // a sequence, which is the thing we must not imply. Neither beat may open
  // with a joining word ("So…", "And…"), and neither may reference the other
  // as a next step. The `tag` on the second closes the pair.
  //
  // Mirror leads because the cover already sold the act of saying it out loud;
  // opening the deck proper with Vent would restate the cover instead of
  // adding the thing a stranger has not yet been told.
  {
    id: 'mirror',
    kind: 'mirror',
    label: 'The Mirror',
    beat: "Some nights you\nneed to know what\nyou're feeling.",
    aside:
      'Type it or say it. The Mirror reads it back — the feeling, named, in your own words. Not advice, not a diagnosis.',
    symbol: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
    duration: 3800,
  },
  {
    id: 'vent',
    kind: 'vent',
    label: 'Vent',
    beat: 'Other nights you\njust need to\nget it out.',
    aside:
      'Sit with the fire alone and say it. Nothing is stored, nothing answers back. It goes when you close it.',
    tag: 'Either one · any night',
    symbol: { ios: 'mic', android: 'mic', web: 'mic' },
    duration: 3600,
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
    kind: 'xolacers',
    label: 'Xolacers',
    // The only beat where the product is another human, so it is the one place
    // ambiguity actually costs us something: a stranger deciding whether to
    // trust this needs to know who they'd be talking to and what happens to
    // their own identity, in the sentence itself. "They have a name. You don't"
    // is the whole arrangement — theirs is on their profile, yours never
    // exists. Do not soften it into "private" or "safe"; the asymmetry IS the
    // reassurance, and naming it plainly is what makes it believable.
    beat: 'Talk to a real\nperson. They have\na name. You don’t.',
    aside:
      'Real volunteers with names, faces, and a thing they’re good at listening to. You choose who. You stay anonymous.',
    // Not decoration and not a disclaimer bolted on: it is the single fact that
    // keeps every promise above it honest. It stays.
    tag: 'Trained peers · not therapists',
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
