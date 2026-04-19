import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';

export type BreathPattern = 'physiological_sigh' | 'extended_exhale' | 'slow_exhale';

export type PacedOrbHandle = {
  playCycle: (pattern: BreathPattern, cycles: number) => Promise<void>;
};

type StepTiming = { to: number; duration: number };

const TIMINGS: Record<BreathPattern, StepTiming[]> = {
  physiological_sigh: [
    { to: 1.3, duration: 4000 },
    { to: 1.35, duration: 1000 },
    { to: 1.0, duration: 8000 },
  ],
  extended_exhale: [
    { to: 1.3, duration: 4000 },
    { to: 1.0, duration: 8000 },
  ],
  slow_exhale: [
    { to: 1.2, duration: 3000 },
    { to: 1.0, duration: 6000 },
  ],
};

const HALO_SIZE = 240;
const CORE_SIZE = 150;

type Props = { reducedMotion?: boolean };

export const PacedOrb = forwardRef<PacedOrbHandle, Props>(
  ({ reducedMotion = false }, ref) => {
    const accentColor = useThemeColor('accent');
    const scale = useSharedValue(1.0);
    const coreOpacity = useSharedValue(0.4);
    const haloOpacity = useSharedValue(0.08);

    useImperativeHandle(ref, () => ({
      playCycle: (pattern, cycles) =>
        new Promise<void>((resolve) => {
          const steps = TIMINGS[pattern];
          const totalMs = steps.reduce((acc, s) => acc + s.duration, 0) * cycles;

          if (reducedMotion) {
            setTimeout(resolve, totalMs);
            return;
          }

          cancelAnimation(scale);
          cancelAnimation(coreOpacity);
          cancelAnimation(haloOpacity);

          const scaleAnims: ReturnType<typeof withTiming>[] = [];
          const coreAnims: ReturnType<typeof withTiming>[] = [];
          const haloAnims: ReturnType<typeof withTiming>[] = [];

          for (let i = 0; i < cycles; i++) {
            steps.forEach((step, j) => {
              const isInhale = j === 0;
              scaleAnims.push(withTiming(step.to, { duration: step.duration }));
              coreAnims.push(
                withTiming(isInhale ? 0.8 : 0.4, { duration: step.duration }),
              );
              haloAnims.push(
                withTiming(isInhale ? 0.15 : 0.08, { duration: step.duration }),
              );
            });
          }

          if (scaleAnims.length > 0) {
            scale.value = withSequence(scaleAnims[0], ...scaleAnims.slice(1));
            coreOpacity.value = withSequence(coreAnims[0], ...coreAnims.slice(1));
            haloOpacity.value = withSequence(haloAnims[0], ...haloAnims.slice(1));
          }

          setTimeout(resolve, totalMs);
        }),
    }));

    const scaleStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    const coreStyle = useAnimatedStyle(() => ({ opacity: coreOpacity.value }));
    const haloStyle = useAnimatedStyle(() => ({ opacity: haloOpacity.value }));

    return (
      <Animated.View className="items-center justify-center">
        <Animated.View style={scaleStyle}>
          <View
            style={{
              width: HALO_SIZE,
              height: HALO_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: HALO_SIZE,
                  height: HALO_SIZE,
                  borderRadius: HALO_SIZE / 2,
                  backgroundColor: accentColor,
                },
                haloStyle,
              ]}
            />
            <Animated.View
              style={[
                {
                  width: CORE_SIZE,
                  height: CORE_SIZE,
                  borderRadius: CORE_SIZE / 2,
                  backgroundColor: accentColor,
                },
                coreStyle,
              ]}
            />
          </View>
        </Animated.View>
      </Animated.View>
    );
  },
);

PacedOrb.displayName = 'PacedOrb';
