import { FlatList, type ListRenderItem } from "react-native";
import { useCallback, useMemo } from "react";
import { TimelineEntryCard } from "@/components/timeline/timeline-entry-card";
import { TimelineSectionHeader } from "@/components/timeline/timeline-section-header";
import { buildTimelineSections } from "@/helpers/utils/timeline";
import type { TimelineEntry, TimelineFlatItem } from "@/interfaces/timeline";

const now = new Date();
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

// TODO: replace with real data from backend/store
const MOCK_ENTRIES: TimelineEntry[] = [
  {
    id: "1",
    quote: "There's something heavy sitting in your chest today.",
    emotion: "Frustration",
    emotionEmoji: "😔",
    responseType: "Just needed to say it",
    timestamp: daysAgo(0),
  },
  {
    id: "2",
    quote: "A quiet, steady day. Solid ground.",
    emotion: "Calm",
    emotionEmoji: "🟢",
    responseType: "Sat with this",
    timestamp: daysAgo(2),
  },
  {
    id: "3",
    quote: "A quiet, steady day. Solid ground.",
    emotion: "Calm",
    emotionEmoji: "🟢",
    responseType: "Sat with this",
    timestamp: daysAgo(2),
  },
  {
    id: "4",
    quote: "A pattern you keep hoping will change.",
    emotion: "Frustration",
    emotionEmoji: "😤",
    responseType: "You're not alone",
    timestamp: daysAgo(5),
  },
];

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
