import { FlatList, type ListRenderItem } from "react-native";
import { useCallback, useMemo } from "react";
import { TimelineEntryCard } from "@/components/timeline/timeline-entry-card";
import { TimelineSectionHeader } from "@/components/timeline/timeline-section-header";
import { buildTimelineSections } from "@/helpers/utils/timeline";
import { MOCK_ENTRIES } from "@/helpers/utils/timeline-mock";
import type { TimelineFlatItem } from "@/interfaces/timeline";

export const TimelineScreen = () => {
  const data = useMemo(() => buildTimelineSections(MOCK_ENTRIES), []);

  const renderItem: ListRenderItem<TimelineFlatItem> = useCallback(
    ({ item, index }) => {
      if (item.type === "section") {
        return (
          <TimelineSectionHeader label={item.label} isFirst={index === 0} />
        );
      }
      return <TimelineEntryCard entry={item.entry} />;
    },
    [],
  );

  const keyExtractor = useCallback((item: TimelineFlatItem) => item.id, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // getItemType goes here when migrating to FlashList / LegendList
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};
