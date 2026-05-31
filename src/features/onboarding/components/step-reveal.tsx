import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { Presets } from 'react-native-pulsar';
import { AppText } from '@/src/components/shared/app-text';
import { STEP_BASE_DELAY, STEP_INTERVAL } from '@/src/features/onboarding/frame-steps';
import type { FrameStep } from '@/src/features/onboarding/frame-steps';

type Props = {
  step: FrameStep;
  index: number;
};

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL = { opacity: 0, translateY: 20 };
const EASE_ANIMATE = { opacity: 1, translateY: 0 };
// Ember amber color — onboarding-specific, predates theme system
const EMBER_60 = 'rgba(217, 171, 111, 0.6)';
const EMBER_85 = 'rgba(217, 171, 111, 0.85)';

export const StepReveal = ({ step, index }: Props) => {
  useEffect(() => {
    const delay = STEP_BASE_DELAY + index * STEP_INTERVAL;
    const timer = setTimeout(() => { Presets.feather(); }, delay);
    return () => clearTimeout(timer);
  // index is fixed for a step's lifetime
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transition = {
    opacity: { type: 'timing' as const, duration: 400, delay: STEP_BASE_DELAY + index * STEP_INTERVAL, easing: EASING },
    transform: { type: 'spring' as const, damping: 15, stiffness: 120, mass: 1, delay: STEP_BASE_DELAY + index * STEP_INTERVAL },
  };
  const actionStyle = { fontFamily: 'Poppins-Medium', color: EMBER_85 };

  return (
    <EaseView
      initialAnimate={EASE_INITIAL}
      animate={EASE_ANIMATE}
      transition={transition}
      style={styles.row}
    >
      {/* Amber dot */}
      <View style={styles.dot} />

      <View style={styles.textBlock}>
        <AppText className="text-[16px]" style={actionStyle}>
          {step.action}
        </AppText>
        <AppText
          className="text-[14px] text-white/40"
          style={styles.fontLight}
        >
          {step.detail}
        </AppText>
      </View>
    </EaseView>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 10 },
   
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: EMBER_60, marginTop: 7 },
  textBlock: { flex: 1, gap: 2 },
  fontLight: { fontWeight: '300' as const },
});
