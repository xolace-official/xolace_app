import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { PhotoCard, readerHref } from '@/src/features/library/home/entry-cards';
import { capitalise } from './reader-copy';

// The reader sheet's side padding (`px-6`).
const GUTTER = 48;

/**
 * The next entry as a photo card, #395's magazine close (#417). The server
 * picks it by rule (`library.next.getNext`); nothing qualifies, no card.
 * The hub rides along so a hub reads through in order.
 */
export function UpNext({ entryId }: { entryId: Id<'library_entries'> }) {
  const { hub } = useLocalSearchParams<{ hub?: string }>();
  const next = useQuery(api.library.next.getNext, { entryId, hub });
  const width = useWindowDimensions().width - GUTTER;
  if (!next) return null;
  // ponytail: no play button yet; playing another entry's audio from inside this reader needs its own pass on useEntryAudio (#411).
  return (
    <PhotoCard
      entry={next}
      kicker={`Up next · ${capitalise(next.kind)}`}
      width={width}
      height={(width * 3) / 4}
      href={readerHref(next.slug, 'next', hub)}
    />
  );
}
