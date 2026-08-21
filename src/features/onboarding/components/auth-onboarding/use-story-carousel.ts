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
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { STORY_BEATS, type StoryBeat } from '@/src/features/onboarding/story-beats';

const SWIPE_THRESHOLD = 24;
const DRAG_DAMPING = 260;

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
    progress.set(withTiming(1, { duration: 420 }));
  };
  const collapse = () => {
    isDragging.set(false);
    progress.set(withTiming(0, { duration: 380 }));
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startProgress.set(progress.get());
      isDragging.set(true);
    })
    .onUpdate((e) => {
      progress.set(Math.min(1, Math.max(0, startProgress.get() - e.translationY / DRAG_DAMPING)));
    })
    .onEnd(() => {
      const moved = (progress.get() - startProgress.get()) * DRAG_DAMPING;
      const target =
        moved > SWIPE_THRESHOLD ? 1 : moved < -SWIPE_THRESHOLD ? 0 : startProgress.get() > 0.5 ? 1 : 0;
      progress.set(
        withSpring(target, { damping: 22, stiffness: 140, mass: 0.9 }, (finished) => {
          if (finished && target === 0) isDragging.set(false);
        }),
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
