import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { LegendList } from '@legendapp/list/react-native';
import { useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { topicRows, type Segment, type TopicRow } from '../topic-sections';
import { BrowseFilterMenu, type FilterOption } from './browse-filter-menu';
import { FAMILY_LABEL, TrackRow, type TrackItem } from './track-row';

type Row = TopicRow<TrackItem>;
const keyExtractor = (row: Row) => row.key;
const getItemType = (row: Row) => row.type;

function renderItem({ item }: { item: Row }) {
  if (item.type === 'header') {
    return (
      <AppText className="text-muted px-4 pb-1 pt-6 text-[13px] font-semibold uppercase tracking-wide">
        {item.title}
      </AppText>
    );
  }
  return <TrackRow track={item.track} from="topic" glyph />;
}

const titleFor = (slug: string) => {
  const words = slug.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Topic screen (`topic/[slug]`, §9.3) — both families for one topic behind
 * an All / Music / Support audio header filter; a zero-count option is
 * disabled, not empty. The only list both families share, so rows carry the
 * family glyph. Episodes group under their series client-side.
 */
export function TopicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const posthog = usePostHog();
  const tracks = useQuery(api.browse.getTopic, { slug });
  const [segment, setSegment] = useState<Segment>('all');

  useEffect(() => {
    posthog.capture('browse_topic_opened', { topic: slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const music = tracks?.filter((t) => t.family === 'music').length ?? 0;
  const support = tracks?.filter((t) => t.family === 'support').length ?? 0;
  const options: FilterOption<Segment>[] = [
    { value: 'all', label: 'All' },
    { value: 'music', label: FAMILY_LABEL.music, icon: 'music.note', disabled: tracks !== undefined && music === 0 },
    { value: 'support', label: FAMILY_LABEL.support, icon: 'waveform', disabled: tracks !== undefined && support === 0 },
  ];

  return (
    <>
      <Stack.Screen options={{ title: titleFor(slug) }} />
      <BrowseFilterMenu title="Show" value={segment} options={options} onChange={setSegment} />
      <LegendList
        data={topicRows(tracks ?? [], segment)}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        estimatedItemSize={68}
        recycleItems
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
      />
    </>
  );
}
