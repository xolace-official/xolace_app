import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/src/components/shared/app-text';
import {
  BREATH_CYCLE_MS,
  PacedOrb,
  type BreathPattern,
  type PacedOrbHandle,
} from '@/src/features/sit-with-this/components/paced-orb';

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
  const deadlineRef = useRef(0);
  const remainingRef = useRef(0);
  const orbRef = useRef<PacedOrbHandle>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const isBreath = !!(syncToBreath && breathPattern && breathCycles);
    const totalMs = isBreath
      ? BREATH_CYCLE_MS[breathPattern!] * breathCycles!
      : durationSeconds * 1000;
    remainingRef.current = totalMs;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onComplete();
    };

    const startTimer = (ms: number) => {
      deadlineRef.current = Date.now() + ms;
      timerRef.current = setTimeout(finish, ms);
    };

    const startBreath = (cycles: number) => {
      deadlineRef.current = Date.now() + BREATH_CYCLE_MS[breathPattern!] * cycles;
      orbRef.current?.playCycle(breathPattern!, cycles).then(() => {
        // cancel() clears the resolve timer, so this only fires on natural completion.
        finish();
      });
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        if (pausedAtRef.current !== null || doneRef.current) return;
        pausedAtRef.current = Date.now();
        remainingRef.current = Math.max(0, deadlineRef.current - Date.now());
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (isBreath) orbRef.current?.cancel();
      } else if (state === 'active' && pausedAtRef.current !== null) {
        pausedAtRef.current = null;
        if (doneRef.current) return;
        if (remainingRef.current === 0) {
          finish();
          return;
        }
        if (isBreath && breathPattern) {
          const cycleMs = BREATH_CYCLE_MS[breathPattern];
          const remainingCycles = Math.max(1, Math.ceil(remainingRef.current / cycleMs));
          startBreath(remainingCycles);
        } else {
          startTimer(remainingRef.current);
        }
      }
    });

    if (isBreath) {
      startBreath(breathCycles!);
    } else {
      startTimer(totalMs);
    }

    return () => {
      sub.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isBreath) orbRef.current?.cancel();
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
