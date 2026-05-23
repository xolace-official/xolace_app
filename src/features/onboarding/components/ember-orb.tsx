import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const PALETTES: [string, string, string][] = [
  ['#D4A058', '#C4803C', '#A06020'], // warm amber
  ['#E0B06A', '#D09050', '#B07030'], // brighter gold
  ['#F0C878', '#E0A858', '#C08838'], // hot ember
];

const HALO_SIZE = 220;
const CORE_SIZE = 140;
const HALO_GRADIENT_START = { x: 0.5, y: 0 };
const HALO_GRADIENT_END = { x: 0.5, y: 1 };
const CORE_GRADIENT_START = { x: 0.3, y: 0 };
const CORE_GRADIENT_END = { x: 0.7, y: 1 };

type Props = {
  phase: 0 | 1 | 2;
};

const EmberOrbComponent = ({ phase }: Props) => {
  "use no memo";
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.08, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [scale]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const colors = PALETTES[phase];
  // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const haloColors: [string, string, string] = [colors[0] + '18', colors[1] + '10', colors[2] + '08'];
  // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const coreColors: [string, string, string] = [colors[0] + '90', colors[1] + '70', colors[2] + '50'];

  return (
    <View style={styles.container}>
      <Animated.View style={breathStyle}>
        {/* Halo */}
        <View style={styles.haloWrapper}>
          <AnimatedGradient
            key={`halo-${phase}`}
            entering={FadeIn.duration(800)}
            exiting={FadeOut.duration(800)}
            colors={haloColors}
            start={HALO_GRADIENT_START}
            end={HALO_GRADIENT_END}
            style={styles.haloGradient}
          />

          {/* Core */}
          <AnimatedGradient
            key={`core-${phase}`}
            entering={FadeIn.duration(800)}
            exiting={FadeOut.duration(800)}
            colors={coreColors}
            start={CORE_GRADIENT_START}
            end={CORE_GRADIENT_END}
            style={styles.coreGradient}
          />
        </View>
      </Animated.View>
    </View>
  );
};

export const EmberOrb = memo(EmberOrbComponent);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  haloWrapper: { width: HALO_SIZE, height: HALO_SIZE, alignItems: 'center', justifyContent: 'center' },
  haloGradient: { position: 'absolute', width: HALO_SIZE, height: HALO_SIZE, borderRadius: HALO_SIZE / 2 },
  coreGradient: { width: CORE_SIZE, height: CORE_SIZE, borderRadius: CORE_SIZE / 2 },
});
