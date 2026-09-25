/**
 * The one Lantern list (#393 routes): a hub in the editor's order (cover and
 * intro on top, entries numbered, audio rows inline), or every active entry
 * of a kind or subject. Filter/sort menu from #396 is not built yet.
 */
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { TrackRow } from '@/src/features/browse/components/track-row';
import { EntryRow } from './entry-cards';
import { KINDS, type Kind, facetLabel } from './library-copy';

export type ListBy = { hub: string } | { kind: Kind } | { subject: string };

function HubList({ slug }: { slug: string }) {
  const { width } = useWindowDimensions();
  const hub = useQuery(api.library.hubs.getHub, { slug });
  if (hub === undefined) return null;
  if (hub === null) return <Empty line="This hub has been put away." />;

  let n = 0;
  return (
    <>
      <View className="bg-surface-secondary" style={{ width, height: width * 0.62 }}>
        {hub.coverUrl && <Image source={{ uri: hub.coverUrl }} style={{ width: '100%', height: '100%' }} transition={200} />}
      </View>
      <View className="gap-2 px-4 pb-2 pt-5">
        <AppText accessibilityRole="header" className="text-[30px] font-bold leading-[35px]">
          {hub.title}
        </AppText>
        <AppText className="text-[16px] leading-[22px] text-muted">{hub.intro}</AppText>
      </View>
      {hub.items.map((item) =>
        item.kind === 'entry' ? (
          <EntryRow key={item.entry._id} entry={item.entry} index={n++} />
        ) : (
          <TrackRow key={item.track._id} track={item.track} from="library-hub" />
        ),
      )}
    </>
  );
}

function EntryList({ kind, subject }: { kind?: Kind; subject?: string }) {
  const entries = useQuery(api.library.entries.listEntries, { kind, subject });
  if (entries === undefined) return null;
  if (entries.length === 0) return <Empty line="Nothing here yet." />;
  return entries.map((e) => <EntryRow key={e._id} entry={e} />);
}

const Empty = ({ line }: { line: string }) => (
  <AppText className="px-4 pt-12 text-center text-[15px] text-muted">{line}</AppText>
);

export function LibraryListScreen({ by }: { by: ListBy }) {
  const title =
    'kind' in by ? (KINDS.find((k) => k.kind === by.kind)?.label ?? '') : 'subject' in by ? facetLabel(by.subject) : '';

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {'hub' in by ? (
          <HubList slug={by.hub} />
        ) : (
          <EntryList kind={'kind' in by ? by.kind : undefined} subject={'subject' in by ? by.subject : undefined} />
        )}
      </ScrollView>
    </>
  );
}
