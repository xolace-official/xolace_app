import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PressableFeedback } from 'heroui-native';
import { playSoftPress } from '@/src/lib/haptics';

const MIC_ICON = { ios: 'mic.fill', android: 'mic', web: 'mic' } as const;
const STOP_ICON = { ios: 'stop.fill', android: 'stop', web: 'stop' } as const;

// Fixed artwork colors from the vent design spec — the ritual screen is dark
// in every theme, so these don't track theme tokens.
const RECORDING_AMBER = '#C4883F';
const IDLE_RING = '#9399A8';
const ICON_COLOR = '#F5F0E8';

type Props = {
  recording: boolean;
  onPress: () => void;
};

/**
 * The mic button: 60px circle, ~100px from the bottom edge. Idle shows a
 * slow pulsing ring; recording swaps to a solid warm-amber ring with a stop
 * square. The parent fades the whole button out when the burn begins.
 */
export function VentMicButton({ recording, onPress }: Props) {
  const ringPulse = useSharedValue(0);

  useEffect(() => {
    if (recording) {
      ringPulse.set(withTiming(1, { duration: 250 }));
      return;
    }
    ringPulse.set(
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.15, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [recording, ringPulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringPulse.get(),
    transform: [{ scale: recording ? 1.12 : 1 }],
    borderColor: recording ? RECORDING_AMBER : IDLE_RING,
  }));

  const handlePress = () => {
    playSoftPress();
    onPress();
  };

  return (
    <PressableFeedback
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Stop and release' : 'Start speaking'}
      hitSlop={16}
    >
      <View className="h-[60px] w-[60px] items-center justify-center">
        <Animated.View
          className="absolute h-[60px] w-[60px] rounded-full border-2"
          style={ringStyle}
        />
        <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-white/5">
          <SymbolView
            name={recording ? STOP_ICON : MIC_ICON}
            size={recording ? 20 : 24}
            tintColor={recording ? RECORDING_AMBER : ICON_COLOR}
          />
        </View>
      </View>
    </PressableFeedback>
  );
}
