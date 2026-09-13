import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { LegendList } from '@legendapp/list/react-native';
import { usePostHog } from 'posthog-react-native';
import { ActivityIndicator, View } from 'react-native';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { useStablePaginatedQuery } from '@/src/lib/convex/use-stable-query';
import { BrowseFilterMenu, type FilterOption } from './browse-filter-menu';
import { FAMILY_LABEL, TrackRow, type TrackItem } from './track-row';

type Family = keyof typeof FAMILY_LABEL;
const PAGE_SIZE = 30;
const FAMILY_OPTIONS: FilterOption<Family>[] = [
  { value: 'support', label: FAMILY_LABEL.support, icon: 'waveform' },
  { value: 'music', label: FAMILY_LABEL.music, icon: 'music.note' },
];

const renderItem = ({ item }: { item: TrackItem }) => <TrackRow track={item} from="family-list" />;
const keyExtractor = (item: TrackItem) => item._id;

function Empty() {
  return (
    <View className="items-center px-8 pt-24">
      <AppText className="text-muted text-center text-[15px]">Nothing here yet.</AppText>
    </View>
  );
}

/**
 * Per-family list (`list?family=…`, §9.3). The family is swappable from the
 * header toolbar menu; the stable paginated wrapper keeps the previous page
 * on screen while the new family's first page loads, so the swap happens in
 * place instead of blanking the list.
 */
export function FamilyListScreen() {
  const params = useLocalSearchParams<{ family?: Family }>();
  const [family, setFamily] = useState<Family>(params.family === 'music' ? 'music' : 'support');
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('browse_family_opened', { family });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family]);

  const { results, status, isLoading, loadMore } = useStablePaginatedQuery(
    api.browse.listByFamily,
    { family },
    { initialNumItems: PAGE_SIZE },
  );

  return (
    <>
      <Stack.Screen options={{ title: FAMILY_LABEL[family] }} />
      <BrowseFilterMenu title="Family" value={family} options={FAMILY_OPTIONS} onChange={setFamily} />

      <LegendList
        data={results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={68}
        recycleItems
        onEndReached={status === 'CanLoadMore' ? () => loadMore(PAGE_SIZE) : undefined}
        onEndReachedThreshold={0.4}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={status === 'LoadingFirstPage' ? null : Empty}
        ListFooterComponent={isLoading && results.length > 0 ? <ActivityIndicator className="py-4" /> : null}
      />
    </>
  );
}
