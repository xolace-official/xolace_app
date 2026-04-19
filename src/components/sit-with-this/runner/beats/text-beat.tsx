import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/src/components/shared/app-text';
import { PacedOrb, type PacedOrbHandle, type BreathPattern } from '@/src/components/sit-with-this/paced-orb';

type Props = {
  content: string;
  durationSeconds: number;
  onComplete: () => void;
  syncToBreath?: boolean;
  breathPattern?: BreathPattern;
  breathCycles?: number;
  reducedMotion?: boolean;
};

export function TextBeat({
  content,
  durationSeconds,
  onComplete,
  syncToBreath,
  breathPattern,
  breathCycles,
  reducedMotion = false,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const remainingRef = useRef(durationSeconds * 1000);
  const orbRef = useRef<PacedOrbHandle>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (syncToBreath && breathPattern && breathCycles) {
      let cancelled = false;
      orbRef.current?.playCycle(breathPattern, breathCycles).then(() => {
        if (!cancelled && !doneRef.current) {
          doneRef.current = true;
          onComplete();
        }
      });
      return () => { cancelled = true; };
    }

    const startTimer = (ms: number) => {
      timerRef.current = setTimeout(() => { onComplete(); }, ms);
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

  if (syncToBreath && breathPattern && breathCycles) {
    return (
      <Animated.View
        entering={FadeIn.duration(600)}
        className="items-center gap-10"
        accessibilityLiveRegion="polite"
      >
        <PacedOrb ref={orbRef} reducedMotion={reducedMotion} />
        <AppText className="text-center text-base text-foreground/60">
          {content}
        </AppText>
      </Animated.View>
    );
  }

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
