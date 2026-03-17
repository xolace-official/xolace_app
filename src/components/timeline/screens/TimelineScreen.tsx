import { ActivityIndicator, FlatList, View, type ListRenderItem } from 'react-native';
import { TimelineEntryCard } from '@/components/timeline/timeline-entry-card';
import { TimelineSectionHeader } from '@/components/timeline/timeline-section-header';
import { AppText } from '@/components/shared/app-text';
import { useTimeline } from '@/hooks/use-timeline';
import type { TimelineFlatItem } from '@/interfaces/timeline';

const renderItem: ListRenderItem<TimelineFlatItem> = ({ item, index }) => {
  if (item.type === 'section') {
    return <TimelineSectionHeader label={item.label} isFirst={index === 0} />;
  }
  return <TimelineEntryCard entry={item.entry} />;
};

const keyExtractor = (item: TimelineFlatItem) => item.id;

export const TimelineScreen = () => {
  const { sections, isEmpty, isLoading, canLoadMore, isLoadingMore, loadMore } =
    useTimeline();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View className="flex-1 items-center justify-center px-10">
        <AppText className="text-center text-base leading-7 text-foreground/30">
          Your reflections will appear here{'\n'}after your first session.
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={canLoadMore ? loadMore : undefined}
      onEndReachedThreshold={0.4}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator style={{ paddingVertical: 20 }} />
        ) : null
      }
    />
  );
};
