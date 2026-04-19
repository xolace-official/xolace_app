import { useEffect, useRef } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/src/components/shared/app-text';

type Props = {
  content: string;
  durationSeconds: number;
  reducedMotion: boolean;
  onComplete: () => void;
};

export function HapticBeat({ content, durationSeconds, reducedMotion, onComplete }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Gate haptic on reducedMotion per plan §4.2 — dissociated states can be startled.
    if (!reducedMotion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    timerRef.current = setTimeout(onComplete, durationSeconds * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Mount-once: haptic props are fixed for a beat's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="items-center px-8"
      accessibilityLiveRegion="polite"
    >
      <AppText className="text-center text-xl font-medium leading-relaxed text-foreground">
        {content}
      </AppText>
    </Animated.View>
  );
}
