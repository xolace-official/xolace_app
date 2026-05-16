import { useEffect, useRef } from 'react';
import { EaseView } from 'react-native-ease/uniwind';
import { AppText } from '@/src/components/shared/app-text';
import { PacedOrb, type PacedOrbHandle, type BreathPattern } from '@/src/features/sit-with-this/components/paced-orb';
import { playBreathPhase } from '@/src/lib/haptics';

type Props = {
  content: string;
  breathPattern: BreathPattern;
  breathCycles: number;
  reducedMotion: boolean;
  onComplete: () => void;
};

export function BreathBeat({
  content,
  breathPattern,
  breathCycles,
  reducedMotion,
  onComplete,
}: Props) {
  const orbRef = useRef<PacedOrbHandle>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const onPhaseTransition = reducedMotion ? undefined : playBreathPhase;

    orbRef.current?.playCycle(breathPattern, breathCycles, onPhaseTransition).then(() => {
      if (!cancelled && !doneRef.current) {
        doneRef.current = true;
        onComplete();
      }
    });

    return () => {
      cancelled = true;
    };
    // Mount-once: breath props are fixed for a beat's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EaseView
      initialAnimate={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
      className="items-center gap-10"
    >
      <PacedOrb ref={orbRef} reducedMotion={reducedMotion} />
      <AppText
        className="text-center text-base text-foreground/60"
        accessibilityLiveRegion="polite"
      >
        {content}
      </AppText>
    </EaseView>
  );
}
