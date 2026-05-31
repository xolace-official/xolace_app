export const TOUR_STEPS = [
  { title: 'Start by writing.', description: "Tap here and type whatever's on your mind." },
  { title: 'Or speak instead.', description: 'Tap this button to record your voice.' },
  { title: 'Can\'t write? Tap words that fit.', description: 'Select any that match how you feel right now.' },
  { title: 'Switch word sets.', description: 'Different sets for different moods.' },
] as const;

export type TourStep = (typeof TOUR_STEPS)[number];
