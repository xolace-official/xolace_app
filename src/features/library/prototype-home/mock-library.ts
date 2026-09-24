/**
 * PROTOTYPE — throwaway (#396). Mock catalogue shaped like the #387 content
 * model (kind + subject/audience/emotion facets, ordered hubs, sources) so the
 * home/browse variants have realistic density. No Convex, no persistence.
 */
export type Kind = 'explainer' | 'advice' | 'story';

export type Entry = {
  slug: string;
  kind: Kind;
  title: string;
  dek: string;
  subject: string;
  audiences: string[];
  emotion: string;
  readMin: number;
  listenMin: number;
  source: string;
  helped: number;
  cover: string;
  /** 0–1 read progress; only set for the "returning reader" state */
  progress?: number;
};

const cover = (seed: string, w = 900, h = 700) => `https://picsum.photos/seed/lantern-${seed}/${w}/${h}`;

export const ENTRIES: Entry[] = [
  { slug: 'mind-wont-switch-off', kind: 'explainer', title: "When your mind won't switch off at night", dek: 'Why the quiet is when everything comes back — and what loosens the loop.', subject: 'Sleep', audiences: [], emotion: 'overwhelmed', readMin: 6, listenMin: 9, source: 'NHS Every Mind Matters', helped: 42, cover: cover('night'), progress: 0.4 },
  { slug: 'five-minute-wind-down', kind: 'advice', title: 'The 5-minute wind-down that actually works', dek: 'A short, dull, repeatable ritual. That is the point.', subject: 'Sleep', audiences: [], emotion: 'restless', readMin: 4, listenMin: 6, source: 'Mind', helped: 118, cover: cover('wind') },
  { slug: 'first-term-lonely', kind: 'story', title: 'Everyone seemed to have friends by week two', dek: 'A first-year on the loneliest month of uni, and the small thing that changed it.', subject: 'Loneliness', audiences: ['Student'], emotion: 'lonely', readMin: 7, listenMin: 10, source: 'Student Minds', helped: 64, cover: cover('campus'), progress: 0.75 },
  { slug: 'what-is-burnout', kind: 'explainer', title: 'What burnout is, and what it isn’t', dek: 'Exhaustion, distance, and the quiet sense that nothing you do lands.', subject: 'Burnout', audiences: ['Working', 'Founder'], emotion: 'drained', readMin: 8, listenMin: 11, source: 'NIMH', helped: 203, cover: cover('desk') },
  { slug: 'saying-no-at-work', kind: 'advice', title: 'How to say no without a speech', dek: 'Three sentences that protect your week and your relationships.', subject: 'Work', audiences: ['Working'], emotion: 'overwhelmed', readMin: 5, listenMin: 7, source: 'Mental Health Foundation', helped: 91, cover: cover('office') },
  { slug: 'founder-3am', kind: 'story', title: 'The 3am spreadsheet', dek: 'A founder on carrying payroll anxiety alone — and finally saying it out loud.', subject: 'Stress', audiences: ['Founder'], emotion: 'anxious', readMin: 9, listenMin: 13, source: 'Xolace (first-hand)', helped: 27, cover: cover('city') },
  { slug: 'panic-attack-explained', kind: 'explainer', title: 'What’s happening in your body during a panic attack', dek: 'The alarm, the loop, and why it always passes.', subject: 'Panic', audiences: [], emotion: 'anxious', readMin: 6, listenMin: 8, source: 'NHS Every Mind Matters', helped: 310, cover: cover('breath') },
  { slug: 'exam-season', kind: 'advice', title: 'Exam season without the all-nighters', dek: 'Plan for the tired version of you, not the ideal one.', subject: 'Exams', audiences: ['Student'], emotion: 'anxious', readMin: 5, listenMin: 7, source: 'YoungMinds', helped: 55, cover: cover('library') },
  { slug: 'grief-comes-in-waves', kind: 'explainer', title: 'Grief comes in waves, not stages', dek: 'Why it doesn’t move in a straight line, and why that’s normal.', subject: 'Grief', audiences: [], emotion: 'sad', readMin: 7, listenMin: 10, source: 'SAMHSA', helped: 146, cover: cover('sea') },
  { slug: 'dad-after-mum', kind: 'story', title: 'Learning to cook my mum’s recipes', dek: 'A son, a notebook of her handwriting, and a year of Sundays.', subject: 'Grief', audiences: ['Carer'], emotion: 'sad', readMin: 8, listenMin: 12, source: 'Xolace (first-hand)', helped: 12, cover: cover('kitchen') },
  { slug: 'new-parent-identity', kind: 'advice', title: 'When you don’t recognise yourself as a new parent', dek: 'Small ways back to the person you were, alongside the one you’re becoming.', subject: 'Self-worth', audiences: ['Parent'], emotion: 'lost', readMin: 6, listenMin: 9, source: 'Anna Freud', helped: 38, cover: cover('morning') },
  { slug: 'anger-is-information', kind: 'explainer', title: 'Anger is information', dek: 'What it’s pointing at, and how to listen before it speaks for you.', subject: 'Anger', audiences: [], emotion: 'angry', readMin: 5, listenMin: 7, source: 'NAMI', helped: 71, cover: cover('storm') },
  { slug: 'money-worry-list', kind: 'advice', title: 'Put the money worry on paper', dek: 'A one-page way to turn a fog of dread into three next steps.', subject: 'Money worries', audiences: ['Working', 'Student'], emotion: 'anxious', readMin: 4, listenMin: 5, source: 'Mind', helped: 88, cover: cover('paper') },
  { slug: 'friend-drifted', kind: 'story', title: 'The friend who drifted', dek: 'On losing someone who is still alive, still around, just not yours anymore.', subject: 'Friendship', audiences: [], emotion: 'lonely', readMin: 6, listenMin: 9, source: 'Xolace (first-hand)', helped: 9, cover: cover('train') },
];

export const bySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug)!;

export type Hub = { slug: string; title: string; blurb: string; cover: string; entries: string[]; audioOnly: number };

export const HUBS: Hub[] = [
  { slug: 'sleep', title: 'When sleep won’t come', blurb: 'Racing thoughts, 3am wake-ups, and gentle ways back to rest.', cover: cover('dusk', 1200, 800), entries: ['mind-wont-switch-off', 'five-minute-wind-down', 'panic-attack-explained'], audioOnly: 2 },
  { slug: 'first-year', title: 'Your first year away', blurb: 'Loneliness, exams, money — the parts nobody puts in the prospectus.', cover: cover('dorm', 1200, 800), entries: ['first-term-lonely', 'exam-season', 'money-worry-list'], audioOnly: 1 },
  { slug: 'too-much-work', title: 'When work is too much', blurb: 'Burnout, boundaries, and the stories of people who came back from it.', cover: cover('commute', 1200, 800), entries: ['what-is-burnout', 'saying-no-at-work', 'founder-3am'], audioOnly: 1 },
  { slug: 'grief', title: 'Grief, slowly', blurb: 'No stages, no deadlines. Words for the long middle.', cover: cover('field', 1200, 800), entries: ['grief-comes-in-waves', 'dad-after-mum', 'friend-drifted'], audioOnly: 0 },
];

export const KINDS: { kind: Kind; label: string; line: string }[] = [
  { kind: 'explainer', label: 'Explainers', line: 'What’s going on, in plain words' },
  { kind: 'advice', label: 'Advice', line: 'Small things to try' },
  { kind: 'story', label: 'Stories', line: 'People who’ve felt it too' },
];

export const AUDIENCES = ['Student', 'Working', 'Parent', 'Founder', 'Carer'] as const;

export const SUBJECTS = [...new Set(ENTRIES.map((e) => e.subject))].sort();

/** Stand-in for the Understanding: emotions the reader named recently. */
export const RECENT_EMOTIONS = ['overwhelmed', 'lonely'];

/**
 * Deterministic "For you" (#393): facet overlap on audiences + recent
 * emotions, never padded. Returns entries with the reason they matched.
 */
export function forYou(audiences: string[], emotions: string[]) {
  return ENTRIES.flatMap((e) => {
    const aud = e.audiences.find((a) => audiences.includes(a));
    if (aud) return [{ entry: e, reason: `For ${aud === 'Working' ? 'people at work' : `${aud.toLowerCase()}s`}` }];
    if (emotions.includes(e.emotion)) return [{ entry: e, reason: `You named ${e.emotion}` }];
    return [];
  }).slice(0, 6);
}

export const kindLabel = (k: Kind) => ({ explainer: 'Explainer', advice: 'Advice', story: 'Story' })[k];
