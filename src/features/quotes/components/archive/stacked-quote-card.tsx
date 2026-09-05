import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { cubicBezier, type CSSTransitionProperties } from "react-native-reanimated";
import { PressableFeedback } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { Presets } from "react-native-pulsar";
import { AppText } from "@/src/components/shared/app-text";
import type { Doc } from "@/convex/_generated/dataModel";
import { ARCHIVE_TINT_VARS } from "@/src/features/quotes/poster-palette";
import { formatDate } from "@/src/features/quotes/components/archive/archive-date";

/** The peek band: how much of a closed card the card below it leaves showing. */
export const PEEK = 146;
const COLLAPSED = 172;
/** Floor for an open card — a two-line quote still reads as a card, not a strip. */
const MIN_EXPANDED = 288;
const GAP = 16;
/**
 * Constant, never a `flex: 1` spacer. A flexed gap takes its size from the
 * animated-height box, so the title rides the shrink every frame and travels
 * (#296). Nothing inside the box may derive its position from flex.
 */
const TITLE_GAP = 44;
const CARD_PAD_V = 18;

const CARD_EASE = cubicBezier(0.4, 0, 0.2, 1);
/**
 * A CSS transition, not `withSpring(height)` (a Yoga pass per frame for this
 * card and every row below it) and not a layout animation (asymmetric here —
 * on close LegendList reclaims the row's extent in the same commit, so the
 * close snapped). One declarative pair of values, so open and close are the
 * same animation in opposite directions.
 *
 * The curve is load-bearing: a quint-out put 85% of the travel in the first
 * 100ms and read as no animation at all. Reanimated 4.5 has no spring easing
 * for CSS transitions, so a spring feel would have to be sampled into
 * `linear(...)`.
 */
const CARD_TRANSITION: CSSTransitionProperties = {
  transitionProperty: ["height", "marginBottom"],
  transitionDuration: 340,
  transitionTimingFunction: CARD_EASE,
};
/** Not FadeIn/FadeOut: an exiting child runs its own unmount clock while the
 *  parent shrinks. The body stays mounted at opacity 0. */
const BODY_TRANSITION: CSSTransitionProperties = {
  transitionProperty: ["opacity"],
  transitionDuration: 220,
  transitionTimingFunction: CARD_EASE,
};

export function StackedQuoteCard({
  quote,
  index,
  isOpen,
  reduced,
  onToggle,
  onUnsave,
}: {
  quote: Doc<"daily_quotes">;
  index: number;
  isOpen: boolean;
  reduced: boolean;
  onToggle: () => void;
  onUnsave: () => void;
}) {
  const [shadow, ...tints] = useCSSVariable([
    "--color-poster-shadow",
    ...ARCHIVE_TINT_VARS,
  ]) as string[];

  // Measured, not estimated: the content is laid out at its natural height even
  // while the box clips it, so onLayout is the exact open height. A CSS
  // transition cannot animate to `auto` — this is what supplies the number.
  //
  // Keyed by the quote, because `recycleItems` hands this instance a different
  // one: an unkeyed height would open the next card at the last card's size for
  // the frame before onLayout lands.
  const [measured, setMeasured] = useState({ id: quote._id, height: 0 });
  const contentHeight = measured.id === quote._id ? measured.height : 0;
  const expanded = Math.max(MIN_EXPANDED, contentHeight + CARD_PAD_V * 2);

  const { dayMonth, weekday } = formatDate(quote.date);
  const meta = quote.reaction === "resonates" ? `${weekday}, resonated` : weekday;

  return (
    <Animated.View
      style={{
        height: isOpen ? expanded : COLLAPSED,
        marginBottom: isOpen ? GAP : PEEK - COLLAPSED,
        // From the item index: the list paints earlier rows above later ones,
        // so without this the peek band covers the next card's date line.
        zIndex: isOpen ? 9999 : index,
        ...(reduced ? null : CARD_TRANSITION),
      }}
    >
      <Pressable
        style={[styles.card, { backgroundColor: tints[index % tints.length], shadowColor: shadow }]}
        onPress={() => {
          Presets.flick();
          onToggle();
        }}
        accessibilityRole="button"
        accessibilityLabel={quote.title ?? "Saved quote"}
        accessibilityState={{ expanded: isOpen }}
      >
        <View onLayout={(e) => setMeasured({ id: quote._id, height: e.nativeEvent.layout.height })}>
          <AppText className="font-poster-body font-medium text-[12.5px] text-poster-ink">{dayMonth}</AppText>
          <AppText className="mt-px font-poster-body text-[12.5px] text-poster-ink-soft">{meta}</AppText>

          <View style={styles.titleGap} />

          <AppText
            numberOfLines={1}
            className="font-poster-display text-[30px] tracking-[-0.6px] text-poster-ink"
          >
            {quote.title ?? "Kept quote"}
          </AppText>

          <Animated.View
            pointerEvents={isOpen ? "auto" : "none"}
            style={[styles.body, { opacity: isOpen ? 1 : 0 }, reduced ? null : BODY_TRANSITION]}
          >
            <AppText className="mb-3.5 font-poster-body text-[14px] leading-[22px] text-poster-ink-soft">
              {quote.text}
            </AppText>
            <PressableFeedback
              onPress={onUnsave}
              accessibilityRole="button"
              accessibilityLabel="Remove from saved"
              className="self-start rounded-full bg-poster-chip px-4 py-2"
            >
              <AppText className="font-poster-body font-medium text-[12.5px] text-poster-ink">Unsave</AppText>
            </PressableFeedback>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: CARD_PAD_V,
    overflow: "hidden",
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  titleGap: { height: TITLE_GAP },
  body: { marginTop: 12 },
});
