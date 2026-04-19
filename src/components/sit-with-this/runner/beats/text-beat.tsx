import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/src/components/shared/app-text';

type Props = {
  content: string;
  durationSeconds: number;
  onComplete: () => void;
};

export function TextBeat({ content, durationSeconds, onComplete }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const remainingRef = useRef(durationSeconds * 1000);

  useEffect(() => {
    const startTimer = (ms: number) => {
      timerRef.current = setTimeout(() => {
        onComplete();
      }, ms);
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
          pausedAtRef.current = Date.now();
        }
      } else if (state === 'active' && pausedAtRef.current !== null) {
        const elapsed = Date.now() - pausedAtRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        pausedAtRef.current = null;
        startTimer(remainingRef.current);
      }
    });

    startTimer(remainingRef.current);

    return () => {
      sub.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Mount-once: step props are fixed for a beat's lifetime
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
