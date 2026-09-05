import { View, type ScrollViewProps } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/src/components/shared/app-text";
import {
  PEEK,
  StackedThoughtCard,
} from "@/src/features/quotes/components/archive/stacked-thought-card";
import { useSavedQuotes } from "@/src/features/quotes/hooks/use-saved-quotes";
import { useEffectiveReducedMotion } from "@/src/lib/motion/use-effective-reduced-motion";

/**
 * The kept quotes, one card per row.
 *
 * Normal flow with a negative bottom margin — the peek is `PEEK - COLLAPSED`,
 * so opening a card is only that card's own height changing and the list
 * reflows everything below it. That is what makes the rows virtualisable, so
 * 24+ kept quotes need no "View all" cap (#296).
 */
export function ThoughtStack({
  openId,
  onToggle,
}: {
  openId: Id<"daily_quotes"> | null;
  onToggle: (id: Id<"daily_quotes"> | null) => void;
}) {
  const { results, status, loadMore, unsave } = useSavedQuotes();
  const reduced = useEffectiveReducedMotion();

  if (status === "LoadingFirstPage") return null;

  // Empty is its own composition, not the stack at n=0. One card, by contrast,
  // is the ordinary stack with one row — no peek band, no code path.
  if (results.length === 0) {
    return (
      <View className="items-center gap-2 py-20">
        <AppText className="font-poster-display text-lg tracking-[1.2px] text-foreground">
          Nothing kept yet
        </AppText>
        <AppText className="font-poster-body text-[13.5px] text-foreground/60">
          Star a thought and it waits here for you.
        </AppText>
      </View>
    );
  }

  return (
    <LegendList
      data={results}
      keyExtractor={(item) => item._id}
      estimatedItemSize={PEEK}
      recycleItems
      extraData={openId}
      onEndReached={status === "CanLoadMore" ? () => loadMore(12) : undefined}
      onEndReachedThreshold={0.4}
      // The list's scroller has to be gorhom's, or the sheet and the list have
      // no arbitration: without it a drag on the list neither scrolls nor pans,
      // and the sheet cannot be dragged closed at all.
      renderScrollComponent={renderScrollComponent}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <StackedThoughtCard
          quote={item}
          index={index}
          isOpen={item._id === openId}
          reduced={reduced}
          onToggle={() => onToggle(item._id === openId ? null : item._id)}
          onUnsave={() => {
            if (openId === item._id) onToggle(null);
            void unsave(item._id, item.type);
          }}
        />
      )}
    />
  );
}

const renderScrollComponent = (props: ScrollViewProps) => (
  <BottomSheetScrollView {...props}>{props.children}</BottomSheetScrollView>
);

const styles = { content: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 40 } } as const;
