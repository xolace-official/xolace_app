import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useWindowDimensions, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { PhotoCard, readerHref } from '@/src/features/library/home/entry-cards';
import { readTimeLine } from '@/src/features/library/home/library-copy';
import { capitalise } from '@/src/features/library/reader/reader-copy';

// The reader sheet's side padding (`px-6`).
const GUTTER = 48;
const PLAY = { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' } as const;

/**
 * The next entry as a photo card, #395's magazine close (#417). The server
 * picks it by rule (`library.next.getNext`); nothing qualifies, no card.
 * The hub rides along so a hub reads through in order. No save, no views:
 * just kicker, title, read/listen time, and a play mark when it has audio.
 */
export function UpNext({ entryId }: { entryId: Id<'library_entries'> }) {
  const { hub } = useLocalSearchParams<{ hub?: string }>();
  const next = useQuery(api.library.next.getNext, { entryId, hub });
  const width = useWindowDimensions().width - GUTTER;
  if (!next) return null;
  return (
    <PhotoCard
      entry={next}
      kicker={`Up next · ${capitalise(next.kind)}`}
      width={width}
      height={(width * 3) / 4}
      href={readerHref(next.slug, 'next', hub)}
      meta={readTimeLine(next.readMin, 0, next.listenMin)}
      corner={next.listenMin ? <HasAudio /> : null}
    />
  );
}

/** A mark, not a control: says "this one has audio"; the tap goes to the card. */
function HasAudio() {
  const coverInk = String(useCSSVariable('--color-cover-ink'));
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="h-10 w-10 items-center justify-center rounded-full bg-cover-scrim/30"
    >
      <SymbolView name={PLAY} size={15} weight="semibold" tintColor={coverInk} />
    </View>
  );
}
