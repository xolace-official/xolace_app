import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { playSoftPress } from '@/src/lib/haptics';

type Props = {
  size: 'sm' | 'md';
  isRecording: boolean;
  onPress: () => void;
};

export const MicButton = ({ size, isRecording, onPress }: Props) => {
  const accentColor = useThemeColor('accent');
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording && !reduceMotion) {
      scale.value = withRepeat(
        withTiming(1.25, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      bgOpacity.value = withRepeat(
        withTiming(0.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(bgOpacity);
      scale.value = withTiming(1, { duration: 150 });
      bgOpacity.value = withTiming(isRecording ? 0.12 : 0, { duration: 150 });
    }
    return () => {
      cancelAnimation(scale);
      cancelAnimation(bgOpacity);
    };
  }, [isRecording, reduceMotion, scale, bgOpacity]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const iconSize = size === 'md' ? 20 : 14;
  const containerSize = size === 'md' ? 38 : 26;

  const handlePress = () => {
    playSoftPress();
    onPress();
  };

  return (
    <PressableFeedback
      onPress={handlePress}
      hitSlop={10}
      animation={{ scale: { ignoreScaleCoefficient: true, value: 0.9 } }}
      accessibilityRole="button"
      accessibilityLabel={isRecording ? 'Stop voice input' : 'Start voice input'}
    >
      <Animated.View
        style={[
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          animatedContainerStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              backgroundColor: accentColor,
            },
            animatedBgStyle,
          ]}
        />
        <Animated.View style={{ opacity: isRecording ? 1 : 0.4 }}>
          <SymbolView
            name={{ ios: 'mic', android: 'mic', web: 'mic' }}
            size={iconSize}
            tintColor={accentColor}
          />
        </Animated.View>
      </Animated.View>
    </PressableFeedback>
  );
};
