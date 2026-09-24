/**
 * PROTOTYPE — throwaway (#395). "Which section am I in", for a bar label.
 *
 * Cost, deliberately: section offsets are measured once by `onLayout` (one
 * callback per section, at mount). Per frame, a UI-thread reaction compares
 * the scroll line against those N numbers — no layout, no JS. React hears
 * about it only when the index changes, i.e. once per section crossed, and
 * only the component that calls `useCurrentSection` re-renders.
 */
import { useRef, useState } from 'react';
import { runOnJS, useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';

export function useSectionTracker(count: number) {
  const bodyY = useSharedValue(0);
  const sectionYs = useSharedValue<number[]>(Array(count).fill(Number.MAX_SAFE_INTEGER));
  // Layouts arrive in one burst; accumulate on JS so none overwrites another.
  const ys = useRef<number[]>(Array(count).fill(Number.MAX_SAFE_INTEGER));
  const onSectionLayout = (index: number, y: number) => {
    ys.current[index] = y;
    sectionYs.set([...ys.current]);
  };
  return { bodyY, sectionYs, onSectionLayout };
}

export type SectionTracker = ReturnType<typeof useSectionTracker>;

/** -1 until the first heading crosses `line` (points from the viewport top). */
export function useCurrentSection(scrollY: SharedValue<number>, line: number, tracker: SectionTracker) {
  const [index, setIndex] = useState(-1);
  useAnimatedReaction(
    () => {
      const at = scrollY.get() + line - tracker.bodyY.get();
      const ys = tracker.sectionYs.get();
      let idx = -1;
      for (let i = 0; i < ys.length; i++) if (ys[i] <= at) idx = i;
      return idx;
    },
    (now, was) => {
      if (now !== was) runOnJS(setIndex)(now);
    },
    [line],
  );
  return index;
}
