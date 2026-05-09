import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const DRIFT_DURATION_MS = 28000;

export const DuskDriftBackdrop = () => {
  const { width } = useWindowDimensions();
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, {
        duration: DRIFT_DURATION_MS,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [drift]);

  const driftRange = width * 0.18;

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -driftRange + drift.value * driftRange * 2 }],
  }));

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      <AnimatedGradient
        colors={[
          'rgba(245, 178, 124, 0.10)',
          'rgba(168, 132, 178, 0.06)',
          'rgba(54, 70, 110, 0.12)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: width * 1.4,
          },
          rStyle,
        ]}
      />
    </View>
  );
};
