import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Button } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';

// 60% cream-white — more muted than the acknowledgement words (design spec).
const GONE_STYLE = { color: '#F5F0E899' };

type Props = {
  /** When true, stay on screen and surface the crisis resources link. */
  isCrisis: boolean;
  /** Called after "Gone." has fully faded (non-crisis path → auto-dismiss). */
  onDone: () => void;
};

/**
 * The period: "Gone." materializes where the words were, holds 2s, fades
 * over 1s, then auto-dismisses. In the crisis path it stays put and offers
 * the crisis resources screen instead of auto-dismissing.
 */
export function VentGone({ isCrisis, onDone }: Props) {
  const router = useRouter();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isCrisis) {
      opacity.set(withTiming(1, { duration: 400 }));
      return;
    }
    opacity.set(
      withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(
          2000,
          withTiming(0, { duration: 1000 }, (finished) => {
            'worklet';
            if (finished) scheduleOnRN(onDone);
          }),
        ),
      ),
    );
  }, [isCrisis, opacity, onDone]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <View className="absolute inset-0 items-center justify-center px-12">
      <Animated.View style={fadeStyle}>
        <AppText className="text-base font-normal" style={GONE_STYLE}>
          Gone.
        </AppText>
      </Animated.View>

      {isCrisis && (
        <Animated.View
          entering={FadeIn.duration(700).delay(1200)}
          className="absolute bottom-28 items-center gap-4"
        >
          <Button
            variant="ghost"
            size="md"
            onPress={() => router.push('/(protected)/crisis-resources')}
            accessibilityLabel="Open crisis resources"
          >
            <Button.Label className="text-sm text-[#F5F0E8]/70">
              Support is here if you want it
            </Button.Label>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onPress={onDone}
            accessibilityLabel="Close"
          >
            <Button.Label className="text-sm text-[#F5F0E8]/40">Close</Button.Label>
          </Button>
        </Animated.View>
      )}
    </View>
  );
}
