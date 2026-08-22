/**
 * The pagination row, ported from superlist's behaviour to Xolace tokens: the
 * ACTIVE bar is ~3x the width of the others and fills left-to-right over the
 * beat's duration, then auto-advances. Dragging cancels the fill and restarts
 * it on release. Completing the last beat expands the auth sheet on its own.
 */
import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { STORY_BEATS } from '@/src/features/onboarding/story-beats';

const GAP = 4;

type ItemProps = {
  index: number;
  currentIndex: number;
  animatedIndex: SharedValue<number>;
  inactiveWidth: number;
  activeWidth: number;
  total: number;
  duration: number;
  isDragging: SharedValue<boolean>;
  /** Worklet — moves the deck straight from the UI thread. */
  onAdvance: (index: number) => void;
  onFinish: () => void;
};

const PaginationItem = ({
  index,
  currentIndex,
  animatedIndex,
  inactiveWidth,
  activeWidth,
  total,
  duration,
  isDragging,
  onAdvance,
  onFinish,
}: ItemProps) => {
  const fill = useSharedValue(0);

  const barWidth = useDerivedValue(() => {
    const i = animatedIndex.get();
    let width = interpolate(
      i,
      [index - 1, index, index + 1],
      [inactiveWidth, activeWidth, inactiveWidth],
      Extrapolation.CLAMP,
    );

    // Infinite loop: the list duplicates beat 0 at the end, so index `total`
    // is really beat 0 — the first bar must grow and the last must shrink.
    if (index === 0) {
      width = Math.max(
        width,
        interpolate(i, [total - 1, total], [inactiveWidth, activeWidth], Extrapolation.CLAMP),
      );
    }
    if (index === total - 1 && i >= total - 1) {
      width = interpolate(i, [total - 1, total], [activeWidth, inactiveWidth], Extrapolation.CLAMP);
    }
    return width;
  });

  const rBarStyle = useAnimatedStyle(() => ({ width: barWidth.get() }));

  // Width-in-percent is a layout property, but the fill is absolute and
  // childless, so nothing else re-lays-out behind it.
  const rFillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(fill.get(), [0, 1], [0, 100], Extrapolation.CLAMP)}%`,
    opacity: interpolate(barWidth.get(), [inactiveWidth, activeWidth], [0, 1], Extrapolation.CLAMP),
  }));

  useEffect(() => {
    fill.set(0);
    if (currentIndex === index) fill.set(withTiming(1, { duration }));
  }, [currentIndex, index, duration, fill]);

  // Cancel on touch, restart once the finger lifts — rather than resuming
  // mid-bar. Cancelling belongs here and not in the style worklet: a style is
  // evaluated every frame and must not have side effects.
  useAnimatedReaction(
    () => isDragging.get(),
    (dragging) => {
      if (dragging) {
        cancelAnimation(fill);
        return;
      }
      // No `fill > 0` guard: a hold that begins the instant a beat starts
      // leaves the fill at exactly 0, and skipping the restart there would
      // stall the tale on that beat forever.
      if (currentIndex === index) {
        fill.set(0);
        fill.set(withTiming(1, { duration }));
      }
    },
  );

  // Keyed on the threshold, not on `fill` itself: reacting to the raw value
  // would wake this worklet on every frame of the fill, six bars over.
  useAnimatedReaction(
    () => fill.get() >= 1,
    (done, wasDone) => {
      if (!done || wasDone || isDragging.get()) return;
      if (currentIndex === total - 1) {
        // Tale over — the fire invites you to sit down.
        scheduleOnRN(onFinish);
      } else {
        onAdvance(currentIndex + 1);
      }
    },
  );

  return (
    <Animated.View className="h-[2px] rounded-full bg-foreground/15 overflow-hidden" style={rBarStyle}>
      <Animated.View className="absolute top-0 bottom-0 left-0 bg-ember" style={rFillStyle} />
    </Animated.View>
  );
};

export const StoryPagination = ({
  currentIndex,
  animatedIndex,
  isDragging,
  onAdvance,
  onFinish,
}: {
  currentIndex: number;
  animatedIndex: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  onAdvance: (index: number) => void;
  onFinish: () => void;
}) => {
  const { width } = useWindowDimensions();
  const padding = width * 0.16;
  const total = STORY_BEATS.length;
  // Reserve room for the active bar's 3x expansion so the row never overflows.
  const itemWidth = (width - padding * 2 - (total - 1) * GAP) / (total + 2);

  return (
    <View className="flex-row items-center justify-center" style={{ gap: GAP, paddingHorizontal: padding }}>
      {STORY_BEATS.map((beat, index) => (
        <PaginationItem
          key={beat.id}
          index={index}
          currentIndex={currentIndex}
          animatedIndex={animatedIndex}
          inactiveWidth={itemWidth}
          activeWidth={itemWidth * 3}
          total={total}
          duration={beat.duration}
          isDragging={isDragging}
          onAdvance={onAdvance}
          onFinish={onFinish}
        />
      ))}
    </View>
  );
};
