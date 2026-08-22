/**
 * The carousel half of the auth-onboarding screen: horizontal beat paging,
 * an infinite wrap, and the vertical expand/collapse of the sign-in sheet.
 *
 * `progress`: 0 = telling the tale, 1 = sign-in open.
 *
 * Scrolling is driven from the UI thread via `useAnimatedRef` + `scrollTo`,
 * not by calling `scrollToIndex` on a ref captured in a render-time closure
 * (which is what the prototype did, and what forced a `react-hooks/refs`
 * suppression). Everything that moves the list is a worklet, so a tap or an
 * auto-advance never has to round-trip through the RN runtime.
 */
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { playSoftPress } from '@/src/lib/haptics';
import { STORY_BEATS, type StoryBeat } from '@/src/features/onboarding/story-beats';

const SWIPE_THRESHOLD = 24;
const DRAG_DAMPING = 260;
/** A flick past this commits the sheet whichever way it was thrown, however
 *  little ground it covered. Distance alone would eat every fast gesture. */
const FLICK_VELOCITY = 450;
/** One spring for every path into the sheet — press, flick, auto-advance — so
 *  interrupting one mid-flight continues rather than restarts. */
const SHEET_SPRING = {
  duration: 340,
  dampingRatio: 0.82,
  reduceMotion: ReduceMotion.System,
} as const;

/** Beat 0 duplicated at the tail so the wrap has somewhere to land. */
export const LOOPED_BEATS: StoryBeat[] = [...STORY_BEATS, { ...STORY_BEATS[0], id: 'dusk-loop' }];

export const useStoryCarousel = () => {
  const { width } = useWindowDimensions();
  const listRef = useAnimatedRef<Animated.FlatList<StoryBeat>>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useSharedValue(0);
  const animatedIndex = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const progress = useSharedValue(0);
  const startProgress = useSharedValue(0);

  /** Worklet — the one way the deck moves. Callable from any UI-thread code. */
  const scrollToIndex = (index: number) => {
    'worklet';
    scrollTo(listRef, index * width, 0, true);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => isDragging.set(true),
    onScroll: (e) => {
      scrollX.set(e.contentOffset.x);
      animatedIndex.set(e.contentOffset.x / width);
    },
    onEndDrag: () => isDragging.set(false),
    // The list ends on a duplicate of beat 0; once momentum has settled on it,
    // jump back to the real beat 0 so the tale loops instead of dead-ending.
    // Waiting for momentum (rather than onEndReached) means the jump never
    // fights an in-flight scroll — which is what the Android setTimeout in the
    // prototype was working around.
    onMomentumEnd: (e) => {
      if (e.contentOffset.x >= width * STORY_BEATS.length - 1) {
        scrollTo(listRef, 0, 0, false);
      }
    },
  });

  const expand = () => {
    isDragging.set(true);
    progress.set(withSpring(1, SHEET_SPRING));
  };
  const collapse = () => {
    isDragging.set(false);
    progress.set(withSpring(0, SHEET_SPRING));
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startProgress.set(progress.get());
      isDragging.set(true);
    })
    .onUpdate((e) => {
      progress.set(Math.min(1, Math.max(0, startProgress.get() - e.translationY / DRAG_DAMPING)));
    })
    .onEnd((e) => {
      const moved = (progress.get() - startProgress.get()) * DRAG_DAMPING;
      const from = startProgress.get() > 0.5 ? 1 : 0;
      const target =
        Math.abs(e.velocityY) > FLICK_VELOCITY
          ? e.velocityY < 0
            ? 1
            : 0
          : moved > SWIPE_THRESHOLD
            ? 1
            : moved < -SWIPE_THRESHOLD
              ? 0
              : from;
      // The finger's speed carries into the spring, so releasing mid-flick
      // continues the throw instead of restarting from a standstill.
      if (target !== from) scheduleOnRN(playSoftPress);
      progress.set(
        withSpring(
          target,
          { ...SHEET_SPRING, velocity: -e.velocityY / DRAG_DAMPING },
          (finished) => {
            if (finished && target === 0) isDragging.set(false);
          },
        ),
      );
    });

  // Tap advances the tale, but only while it's still being told.
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onStart(() => {
      if (progress.get() > 0) return;
      scrollToIndex(Math.round(animatedIndex.get()) + 1);
      isDragging.set(false);
    });

  return {
    listRef,
    width,
    currentIndex,
    setCurrentIndex,
    scrollX,
    animatedIndex,
    isDragging,
    progress,
    scrollHandler,
    scrollToIndex,
    expand,
    collapse,
    gesture: Gesture.Race(panGesture, tapGesture),
  };
};

export type StoryCarousel = ReturnType<typeof useStoryCarousel>;
