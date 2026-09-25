/**
 * Lantern home copy (#409). Reader-facing prose says "Lantern", never
 * "library" (CONTEXT.md). Facet slugs are stored lowercase-hyphenated.
 */
import type { FunctionReturnType } from 'convex/server';

import type { api } from '@/convex/_generated/api';
import { capitalise, type Kind } from '@/src/features/library/reader/reader-copy';

export type { Kind };
type Reason = FunctionReturnType<typeof api.library.home.getHome>['forYou'][number]['reason'];

const words = (slug: string) => slug.replace(/-/g, ' ');

export const facetLabel = (slug: string) => capitalise(words(slug));

export const KINDS: { kind: Kind; label: string; line: string }[] = [
  { kind: 'explainer', label: 'Explainers', line: 'What’s going on, in plain words' },
  { kind: 'advice', label: 'Advice', line: 'Small things to try' },
  { kind: 'story', label: 'Stories', line: 'People who’ve felt it too' },
];

// ponytail: audio lands in #411 — then this grows "· M min listen" and the Plus mark.
export const readTimeLine = (readMin: number) => `${readMin} min read`;

/** Why For you picked an entry — the card's kicker. */
export function reasonLine({ axis, slug }: Reason) {
  // ponytail: naive plural; audience slugs are simple nouns (student, parent)
  if (axis === 'audience') return `For ${words(slug)}s`;
  if (axis === 'emotion') return `You named ${words(slug)}`;
  return `Around ${words(slug)}`;
}
