/**
 * Lantern home copy (#409). Reader-facing prose says "Lantern", never
 * "library" (CONTEXT.md). Facet slugs are stored lowercase-hyphenated.
 */
import type { Doc } from '@/convex/_generated/dataModel';

export type Kind = Doc<'library_entries'>['kind'];

export const facetLabel = (slug: string) => {
  const words = slug.replace(/-/g, ' ');
  return words[0].toUpperCase() + words.slice(1);
};

export const KINDS: { kind: Kind; label: string; line: string }[] = [
  { kind: 'explainer', label: 'Explainers', line: 'What’s going on, in plain words' },
  { kind: 'advice', label: 'Advice', line: 'Small things to try' },
  { kind: 'story', label: 'Stories', line: 'People who’ve felt it too' },
];

export const kindLabel = (k: Kind) => ({ explainer: 'Explainer', advice: 'Advice', story: 'Story' })[k];

// ponytail: audio lands in #411 — then this grows "· M min listen" and the Plus mark.
export const metaLine = (readMin: number) => `${readMin} min read`;

type Reason = { axis: 'audience' | 'emotion' | 'lifeArea'; slug: string };

/** Why For you picked an entry — the card's kicker. */
export function reasonLine({ axis, slug }: Reason) {
  const label = slug.replace(/-/g, ' ');
  // ponytail: naive plural; audience slugs are simple nouns (student, parent)
  if (axis === 'audience') return `For ${label}s`;
  if (axis === 'emotion') return `You named ${label}`;
  return `Around ${label}`;
}
