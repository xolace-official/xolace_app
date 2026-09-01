// Indexed by a step's `order`, so entries stay in place even when one stops
// being rendered. Since #256 index 1 ("Start by writing") has no target: the
// blank tap area it pointed at is gone, and the card carries step 0 instead.
// The tour rewrite (#246) collapses this list to four steps.
export const TOUR_STEPS = [
  { title: 'The question changes.', description: 'With the time of day, and how long you have been away.' },
  { title: 'Start by writing.', description: "Tap here and type whatever's on your mind." },
  { title: 'Or speak instead.', description: 'Tap this button to record your voice.' },
  { title: 'Can\'t write? Tap words that fit.', description: 'Select any that match how you feel right now.' },
  { title: 'Switch word sets.', description: 'Different sets for different moods.' },
  { title: 'The rest lives here.', description: 'Discovery, Vent and Settings.' },
] as const;

export type TourStep = (typeof TOUR_STEPS)[number];
