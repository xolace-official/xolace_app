/* eslint-disable react-hooks/refs -- PROTOTYPE ONLY.
 * Gesture builders and FlatList callbacks are constructed during render while
 * capturing `listRef`-reading helpers, so the compiler's ref pass can't prove
 * they only run on tap/scroll. It fires on the original superlist sample too —
 * inherent to the ported pattern, not this wiring, and harmless at runtime.
 * ponytail: silenced here because these files get deleted; the production port
 * should instead drive scrolling from a shared value the list owner reacts to,
 * keeping the ref out of render-time closures entirely.
 */
/**
 * PROTOTYPE — throwaway. Ticket #198, variants D & E.
 *
 * D and E are a deliberate controlled A/B on ONE axis — card vs no card — so
 * they share this shell and differ only in `renderBeat` and `backdrop`.
 * (A/B/C each own their layout because they disagree about structure; these
 * two agree about everything except the surface.)
 *
 * Layout follows superlist: the sign-in block and the morphing pill sit in the
 * bottom stack, and the carousel is absolutely positioned ON TOP of them,
 * sliding up out of the way as the sheet opens.
 */
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useRef } from 'react';
import { useWindowDimensions, View, type ViewToken } from 'react-native';
import { FlatList, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScopedTheme } from 'uniwind';

import { LOOPED_BEATS, useStoryCarousel } from './use-story-carousel';
import { STORY_BEATS, type StoryBeat } from './story-slides';
import { StoryPagination } from './story-pagination';
import { MorphingSeatButton, StoryAuthBlock } from './story-auth-sheet';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<StoryBeat>);
/** How far the deck lifts to make room for the sign-in block. */
const LIFT = 250;

export type BeatRenderer = (args: {
  beat: StoryBeat;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
}) => ReactElement | null;

/** A node, or a render fn when the backdrop needs to react to the scroll. */
export type Backdrop =
  | ReactNode
  | ((args: { scrollX: SharedValue<number>; width: number }) => ReactNode);

export const StoryShell = ({
  renderBeat,
  backdrop,
}: {
  renderBeat: BeatRenderer;
  backdrop?: Backdrop;
}) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const c = useStoryCarousel();
  const { progress } = c;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 100, minimumViewTime: 0 }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index == null) return;
      // The tail duplicate reports index === length; the real beat is 0.
      c.setCurrentIndex(first.index >= STORY_BEATS.length ? 0 : first.index);
    },
    [c],
  );

  const rDeckStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [0, -LIFT], Extrapolation.CLAMP) }],
  }));

  const rPaginationStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.25], [1, 0], Extrapolation.CLAMP),
    pointerEvents: progress.get() === 0 ? 'auto' : 'none',
  }));

  const rScrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [0, 0.72], Extrapolation.CLAMP),
  }));

  // #200: the deck is a fixed night surface — fire only reads as a light source
  // against dark, and this runs before the account (so before a theme) exists.
  // Without pinning, `foreground` resolves to the LIGHT theme's dark ink and the
  // copy renders near-black ON the fire, and the auth scrim comes up grey.
  // ScopedTheme keeps every token class intact rather than hard-coding colors.
  return (
    <ScopedTheme theme="dark">
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom + 12 }}>
      {typeof backdrop === 'function' ? backdrop({ scrollX: c.scrollX, width: c.width }) : backdrop}

      {/* Bottom stack — revealed as the deck lifts off it. */}
      <View className="mt-auto">
        <StoryAuthBlock progress={progress} onCollapse={c.collapse} />
        <MorphingSeatButton progress={progress} onExpand={c.expand} onCollapse={c.collapse} />
      </View>

      <GestureDetector gesture={c.gesture}>
        <Animated.View
          className="absolute w-full"
          style={[
            { top: insets.top, height: screenHeight - insets.top - insets.bottom - 80 },
            rDeckStyle,
          ]}
        >
          <AnimatedFlatList
            ref={c.listRef}
            data={LOOPED_BEATS}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) =>
              renderBeat({ beat: item, index, width: c.width, scrollX: c.scrollX })
            }
            horizontal
            pagingEnabled
            initialScrollIndex={0}
            getItemLayout={(_, index) => ({ length: c.width, offset: c.width * index, index })}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={c.scrollHandler}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReached={c.wrapToStart}
          />

          <Animated.View style={rPaginationStyle} className="pt-5">
            <StoryPagination
              currentIndex={c.currentIndex}
              animatedIndex={c.animatedIndex}
              isDragging={c.isDragging}
              onAdvance={c.scrollToIndex}
              onFinish={c.expand}
            />
          </Animated.View>

          {/* Darkens the tale itself as the sheet takes over. Lives inside the
              deck so it can never dim the sign-in block behind it. */}
          <Animated.View
            pointerEvents="none"
            className="absolute inset-0 bg-background"
            style={rScrimStyle}
          />
        </Animated.View>
      </GestureDetector>
    </View>
    </ScopedTheme>
  );
};
