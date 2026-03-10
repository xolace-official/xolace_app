import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';

const HALO_SIZE = 240;
const CORE_SIZE = 150;

const BreathingOrbComponent = () => {
  const accentColor = useThemeColor('accent');
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scale, opacity]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
              opacityStyle,
              { opacity: 0.08 },
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
              opacityStyle,
            ]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export const BreathingOrb = memo(BreathingOrbComponent);
