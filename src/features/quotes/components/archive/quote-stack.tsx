import { View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/src/components/shared/app-text";
import {
  PEEK,
  StackedQuoteCard,
} from "@/src/features/quotes/components/archive/stacked-quote-card";
import { useSavedQuotes } from "@/src/features/quotes/hooks/use-saved-quotes";
import { useAppStore } from "@/src/store/store";
import { useEffectiveReducedMotion } from "@/src/lib/motion/use-effective-reduced-motion";

/**
 * The kept quotes, one card per row.
 *
 * Normal flow with a negative bottom margin — the peek is `PEEK - COLLAPSED`,
 * so opening a card is only that card's own height changing and the list
 * reflows everything below it. That is what makes the rows virtualisable, so
 * 24+ kept quotes need no "View all" cap (#296).
 */
export function QuoteStack({
  openId,
  onToggle,
}: {
  openId: Id<"daily_quotes"> | null;
  onToggle: (id: Id<"daily_quotes"> | null) => void;
}) {
  const { results, status, loadMore, unsave } = useSavedQuotes();
  const reduced = useEffectiveReducedMotion();
  const router = useRouter();
  const setReplySeed = useAppStore((s) => s.setReplySeed);

  // One query for the whole stack, not one per card. `undefined` while it
  // loads counts as active, so the offer appears only once we know it is safe
  // — accepting into a waiting mirror is the failure it guards (#316).
  const activeSession = useQuery(api.sessions.getActive);
  const hasActiveSession = activeSession !== null;

  if (status === "LoadingFirstPage") return null;

  // Empty is its own composition, not the stack at n=0. One card, by contrast,
  // is the ordinary stack with one row — no peek band, no code path.
  if (results.length === 0) {
    return (
      <View className="items-center gap-2 py-20">
        <AppText className="font-poster-display text-lg tracking-[1.2px] text-foreground">
          Nothing kept yet
        </AppText>
        <AppText className="font-poster-body text-[13.5px] text-foreground/65">
          Star a quote and it waits here for you.
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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <StackedQuoteCard
          quote={item}
          index={index}
          isOpen={item._id === openId}
          reduced={reduced}
          hasActiveSession={hasActiveSession}
          onToggle={() => onToggle(item._id === openId ? null : item._id)}
          onUnsave={() => {
            if (openId === item._id) onToggle(null);
            void unsave(item._id, item.type);
          }}
          // The reply seeds the screen, never `rawInput` (#316): it becomes the
          // reflect card's line and the composer opens empty under it, so the
          // ordinary typed path initiates with `open_prompt`. Through the store
          // rather than a route param — this is raw user text, and params ride
          // in navigation state and history.
          onSeed={() => {
            if (!item.reply) return;
            setReplySeed(item.reply);
            router.replace("/");
          }}
        />
      )}
    />
  );
}

const styles = { content: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 40 } } as const;
