/**
 * The reader's copy and body prep, kept pure so it can be tested without a
 * renderer. Reader-facing prose says "Lantern", never "library" (CONTEXT.md).
 */

import type { Doc } from '@/convex/_generated/dataModel';

export type Kind = Doc<'library_entries'>['kind'];
type Reuse = Doc<'library_entries'>['reuse'];

const LEADING_H1 = /^#[ \t]+[^\n]*\n*/;
// ponytail: enriched-markdown 1.0.2 has no GFM admonitions (#386) — the
// marker would render as literal "[!TIP]". Delete this once we're on 1.1.0
// and style `blockquote.admonitions` instead.
const ALERT_MARKER = /^>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*$/gim;

export const capitalise = (s: string) => s[0].toUpperCase() + s.slice(1).toLowerCase();

/** Stored GFM → what the renderer is handed. */
export function prepareBody(markdown: string) {
  return markdown
    .replace(LEADING_H1, '')
    .replace(ALERT_MARKER, (_, type: string) => `> **${capitalise(type)}**\n>`);
}

const CREDIT: Record<Reuse, string> = {
  verbatim: 'Published as they wrote it',
  adapted: 'Adapted from their original',
  original: 'Written for Lantern',
};

/** The line under the source's name: how its words reached this page. */
export const creditLine = (reuse: Reuse) => CREDIT[reuse];

export function metaLine(kind: Kind, readMin: number, storyDescriptor?: string, listenMin?: number) {
  return [capitalise(kind), storyDescriptor, `${readMin} min read`, listenMin && `${listenMin} min listen`]
    .filter(Boolean)
    .join(' · ');
}
