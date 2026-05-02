import { ActivityIndicator, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { TimelineEntryCard } from '@/src/features/timeline/components/timeline-entry-card';
import { TimelineSectionHeader } from '@/src/features/timeline/components/timeline-section-header';
import { AppText } from '@/src/components/shared/app-text';
import { useTimeline } from '@/src/features/timeline/hooks/use-timeline';
import type { TimelineFlatItem } from '@/src/features/timeline/types';
import { FullMorphLoader as ActiveLoader } from '@/src/components/shared/loader/morph/full-morph-loader';

const renderItem = ({ item, index }: { item: TimelineFlatItem; index: number }) => {
  if (item.type === 'section') {
    return <TimelineSectionHeader label={item.label} isFirst={index === 0} />;
  }
  return <TimelineEntryCard entry={item.entry} />;
};

const keyExtractor = (item: TimelineFlatItem) => item.id;

const getEstimatedItemSize = (item: TimelineFlatItem) =>
  item.type === 'section' ? 44 : 120;

export const TimelineScreen = () => {
  const { sections, isLoading, canLoadMore, isLoadingMore, loadMore } =
    useTimeline();

  if (isLoading) {
    return (
      <ActiveLoader />
    );
  }

  return (
    <LegendList
      data={sections}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getEstimatedItemSize={getEstimatedItemSize}
      estimatedItemSize={100}
      recycleItems
      getItemType={(item) => item.type}
      onEndReached={canLoadMore ? loadMore : undefined}
      onEndReachedThreshold={0.4}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center px-10">
          <AppText className="text-center text-base leading-7 text-foreground/30">
            Your reflections will appear here{'\n'} after your first session.
          </AppText>
        </View>
      }
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator style={{ paddingVertical: 20 }} />
        ) : null
      }
    />
  );
};
