import { useEffect, useRef } from 'react';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { playSoftenPulse } from '@/src/lib/haptics';
import { AppText } from '@/src/components/shared/app-text';

type Props = {
  content: string;
  fallbackContent?: string;
  durationSeconds: number;
  reducedMotion: boolean;
  onComplete: () => void;
};

export function HapticBeat({
  content,
  fallbackContent,
  durationSeconds,
  reducedMotion,
  onComplete,
}: Props) {
  "use no memo";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useSharedValue(reducedMotion ? 1 : 0.5);

  useEffect(() => {
    // Gate haptic on reducedMotion per plan §4.2 — dissociated states can be startled.
    if (!reducedMotion) {
      playSoftenPulse();
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    }

    timerRef.current = setTimeout(onComplete, durationSeconds * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Mount-once: haptic props are fixed for a beat's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.5,
    transform: [{ scale: 0.85 + pulse.value * 0.3 }],
  }));

  // With no haptic or pulse, reduced-motion users need a text anchor so the
  // beat isn't silent + blank.
  const displayContent = content || (reducedMotion ? fallbackContent ?? '' : '');

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="items-center gap-8 px-8"
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={dotStyle}
        className="h-16 w-16 rounded-full bg-foreground/25"
      />
      {displayContent ? (
        <AppText className="text-center text-xl font-medium leading-relaxed text-foreground">
          {displayContent}
        </AppText>
      ) : null}
    </Animated.View>
  );
}
