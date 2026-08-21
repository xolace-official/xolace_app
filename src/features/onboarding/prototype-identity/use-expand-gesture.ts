/**
 * PROTOTYPE — throwaway. Ticket #198.
 *
 * The collapse->expand-to-auth mechanic is ALREADY DECIDED by the map (#197):
 * superlist's swipe-up. It is not what this prototype is evaluating, so all
 * three variants drive off this one shared progress value and disagree only
 * about what that progress LOOKS and MOVES like.
 *
 * progress: 0 = collapsed (carousel), 1 = expanded (auth sheet).
 */
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

const SWIPE_THRESHOLD = 24;
/** Drag damping — superlist's /4 feels twitchy on a calm screen. */
const DRAG_DAMPING = 260;

export type ExpandController = {
  progress: SharedValue<number>;
  gesture: ReturnType<typeof Gesture.Pan>;
  expand: () => void;
  collapse: () => void;
};

export const useExpandGesture = (): ExpandController => {
  const progress = useSharedValue(0);
  const startProgress = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startProgress.set(progress.get());
    })
    .onUpdate((e) => {
      // Swipe up (negative translationY) increases progress.
      const proposed = startProgress.get() - e.translationY / DRAG_DAMPING;
      progress.set(Math.min(1, Math.max(0, proposed)));
    })
    .onEnd((e) => {
      const moved = (progress.get() - startProgress.get()) * DRAG_DAMPING;
      const target =
        moved > SWIPE_THRESHOLD ? 1 : moved < -SWIPE_THRESHOLD ? 0 : startProgress.get() > 0.5 ? 1 : 0;
      progress.set(withSpring(target, { damping: 22, stiffness: 140, mass: 0.9 }));
    });

  const expand = () => progress.set(withTiming(1, { duration: 420 }));
  const collapse = () => progress.set(withTiming(0, { duration: 380 }));

  return { progress, gesture, expand, collapse };
};
