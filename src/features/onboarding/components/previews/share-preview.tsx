import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';

const CHIPS = ['heavy', 'foggy', 'tight', 'raw', 'numb', 'scattered'];
const DWELL_MS = 1000;

type ChipProps = {
  word: string;
  chipIndex: number;
  activeChip: SharedValue<number>;
  accentColor: string;
};

const AnimatedChip = ({ word, chipIndex, activeChip, accentColor }: ChipProps) => {
  const press = useSharedValue(0);

  useAnimatedReaction(
    () => activeChip.value,
    (chip) => {
      if (chip === chipIndex) {
        press.value = 0;
        press.value = withSequence(
          withTiming(0.5, { duration: 100, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
        );
      }
    },
  );

  const rContainer = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(press.value, [0, 0.5, 1], [1, 0.88, 1], Extrapolation.CLAMP) },
    ],
  }));

  const rOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(press.value, [0, 0.2, 0.65, 1], [0, 1, 0.8, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={rContainer}>
      <View style={styles.chip}>
        <AppText className="text-foreground/55 text-[9px]">{word}</AppText>
      </View>
      {/* Accent overlay — fades in on tap, fades out before next chip */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.chipOverlay,
          { borderColor: accentColor + '99', backgroundColor: accentColor + '1A' },
          rOverlay,
        ]}
      />
    </Animated.View>
  );
};

type Props = { isActive: SharedValue<boolean> };

export const SharePreview = ({ isActive }: Props) => {
  const accentColor = useThemeColor('accent');
  const progress = useSharedValue(0);

  const activeChip = useDerivedValue(() => Math.floor(progress.value) % CHIPS.length);

  useAnimatedReaction(
    () => isActive.value,
    (active, prev) => {
      if (active && !prev) {
        progress.value = 0;
        progress.value = withRepeat(
          withTiming(CHIPS.length, {
            duration: CHIPS.length * DWELL_MS,
            easing: Easing.steps(CHIPS.length, true),
          }),
          -1,
          false,
        );
      } else if (!active) {
        cancelAnimation(progress);
        progress.value = 0;
      }
    },
  );

  return (
    <View className="flex-1 px-4 pt-5 pb-4 justify-between">
      <View className="gap-2">
        <AppText className="text-foreground/55 text-[11px]">
          What&apos;s here right now?
        </AppText>
        <AppText className="text-foreground/20 text-[10px]">
          Tap to begin writing...
        </AppText>
      </View>

      <View className="gap-2.5">
        <View className="border-t border-foreground/8 pt-3">
          <AppText className="text-foreground/30 text-[9px]">
            Or just tap what feels close:
          </AppText>
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          {CHIPS.map((word, i) => (
            <AnimatedChip
              key={word}
              word={word}
              chipIndex={i}
              activeChip={activeChip}
              accentColor={accentColor}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipOverlay: {
    borderRadius: 999,
    borderWidth: 1,
  },
});
