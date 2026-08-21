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
 * Separate from `use-expand-gesture.ts` (which variants A/B/C use and which
 * must not change). This one adds the three things the tale needs: auto-advance
 * with a drag lock, an infinite wrap, and auto-expansion when the last beat
 * finishes.
 *
 * progress: 0 = telling the tale, 1 = sign-in open.
 */
import { useCallback, useRef, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Gesture } from 'react-native-gesture-handler';
import {
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { STORY_BEATS, type StoryBeat } from './story-slides';

const SWIPE_THRESHOLD = 24;
const DRAG_DAMPING = 260;

/** Beat 0 duplicated at the tail so the wrap has somewhere to land. */
export const LOOPED_BEATS: StoryBeat[] = [...STORY_BEATS, { ...STORY_BEATS[0], id: 'dusk-loop' }];

export const useStoryCarousel = () => {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<StoryBeat>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useSharedValue(0);
  const animatedIndex = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const progress = useSharedValue(0);
  const startProgress = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => isDragging.set(true),
    onScroll: (e) => {
      scrollX.set(e.contentOffset.x);
      animatedIndex.set(e.contentOffset.x / width);
    },
    onEndDrag: () => isDragging.set(false),
  });

  // useCallback here is NOT for memoization (the React Compiler handles that) —
  // it marks these as event handlers so the compiler's ref-safety pass stops
  // treating `listRef.current` as a read during render.
  const scrollToIndex = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  /** Snap back to the real beat 0 once the duplicate is on screen. */
  const wrapToStart = useCallback(() => {
    const jump = () => listRef.current?.scrollToIndex({ index: 0, animated: false });
    // Android needs a beat for momentum to settle or the jump fights the scroll.
    if (Platform.OS === 'android') setTimeout(jump, 100);
    else jump();
  }, []);

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
      scheduleOnRN(scrollToIndex, currentIndex + 1);
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
    wrapToStart,
    expand,
    collapse,
    gesture: Gesture.Race(panGesture, tapGesture),
  };
};

export type StoryCarousel = ReturnType<typeof useStoryCarousel>;
