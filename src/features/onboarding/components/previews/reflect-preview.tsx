import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/src/components/shared/app-text';

const FADE_IN_MS  = 900;
const HOLD_MS     = 3000;
const FADE_OUT_MS = 600;
const PAUSE_MS    = 300;
const CYCLE       = FADE_IN_MS + HOLD_MS + FADE_OUT_MS + PAUSE_MS;

const FADE_IN_END   = FADE_IN_MS / CYCLE;
const FADE_OUT_START = (FADE_IN_MS + HOLD_MS) / CYCLE;
const FADE_OUT_END   = (FADE_IN_MS + HOLD_MS + FADE_OUT_MS) / CYCLE;

type Props = { isActive: SharedValue<boolean> };

export const ReflectPreview = ({ isActive }: Props) => {
  const progress = useSharedValue(0);

  useAnimatedReaction(
    () => isActive.value,
    (active, prev) => {
      if (active && !prev) {
        progress.value = 0;
        progress.value = withRepeat(
          withTiming(1, { duration: CYCLE, easing: Easing.linear }),
          -1,
          false,
        );
      } else if (!active) {
        cancelAnimation(progress);
        progress.value = 0;
      }
    },
  );

  const rMirror = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, FADE_IN_END, FADE_OUT_START, FADE_OUT_END],
      [0,           1,             1,            0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View className="flex-1 px-4 py-5 justify-center gap-3.5">
      <AppText className="text-accent text-[8px]" style={{ letterSpacing: 2 }}>
        THE MIRROR
      </AppText>

      <Animated.View className="border-l-2 border-accent/40 pl-3" style={rMirror}>
        <AppText className="text-foreground italic text-[12px] leading-5">
          Something heavy you can&apos;t put down. Like the day already pressed in before it began.
        </AppText>
      </Animated.View>

      <View className="mt-4 gap-2">
        <AppText className="text-accent text-[11px]" style={{ fontFamily: 'Poppins-Medium' }}>
          That&apos;s it
        </AppText>
        <AppText className="text-foreground/40 text-[10px]">Not quite</AppText>
        <AppText className="text-foreground/40 text-[10px]">Say more</AppText>
      </View>
    </View>
  );
};
