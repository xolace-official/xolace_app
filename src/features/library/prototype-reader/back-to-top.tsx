/**
 * PROTOTYPE — throwaway (#395). Variant A's "back to top", borrowed from B's
 * pill: absent while reading, fades in once the reader reaches the end.
 *
 * The player edge case: `lift` is how far to sit above the docked player
 * when one is on screen. If the player opens or closes while this is showing,
 * the pill slides to its new resting place rather than jumping or overlapping.
 * It owns its own `show` state so reaching the end re-renders only this.
 */
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { AppText } from '@/src/components/shared/app-text';
import { Glyph } from './shared';

export function BackToTop({
  scrollY,
  endAt,
  bottom,
  lift,
  onPress,
}: {
  scrollY: SharedValue<number>;
  /** Scroll offset at which the reader counts as at the end. */
  endAt: number;
  bottom: number;
  lift: number;
  onPress: () => void;
}) {
  const [show, setShow] = useState(false);
  useAnimatedReaction(
    () => scrollY.get() >= endAt,
    (now, was) => {
      if (now !== was) runOnJS(setShow)(now);
    },
    [endAt],
  );
  const rise = useAnimatedStyle(() => ({ transform: [{ translateY: withTiming(-lift, { duration: 240 }) }] }), [lift]);

  if (!show) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      pointerEvents="box-none"
      className="absolute inset-x-0 items-center"
      style={[{ bottom }, rise]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Back to top"
        className="flex-row items-center gap-2 overflow-hidden rounded-full border border-border px-4 py-2.5 active:opacity-70"
      >
        <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
        <View className="absolute inset-0 bg-surface/70" />
        <Glyph name="arrow.up" size={14} />
        <AppText className="font-semibold text-sm">Back to top</AppText>
      </Pressable>
    </Animated.View>
  );
}
