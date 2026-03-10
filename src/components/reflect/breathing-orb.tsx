import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';

const HALO_SIZE = 240;
const CORE_SIZE = 150;

const BreathingOrbComponent = () => {
  const accentColor = useThemeColor('accent');
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const coreOpacity = useSharedValue(0.4);
  const haloOpacity = useSharedValue(0.08);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1.15;
      coreOpacity.value = 0.6;
      haloOpacity.value = 0.12;
      return;
    }

    scale.value = withRepeat(
      withTiming(1.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    coreOpacity.value = withRepeat(
      withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    haloOpacity.value = withRepeat(
      withTiming(0.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(coreOpacity);
      cancelAnimation(haloOpacity);
    };
  }, [scale, coreOpacity, haloOpacity, reduceMotion]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const coreOpacityStyle = useAnimatedStyle(() => ({
    opacity: coreOpacity.value,
  }));

  const haloOpacityStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(800).delay(300)}
      className="items-center justify-center"
    >
      <Animated.View style={breathStyle}>
        <View
          style={{ width: HALO_SIZE, height: HALO_SIZE, alignItems: 'center', justifyContent: 'center' }}
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
              haloOpacityStyle,
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
              coreOpacityStyle,
            ]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export const BreathingOrb = memo(BreathingOrbComponent);
