/**
 * PROTOTYPE — throwaway. Ticket #198, variants D & E.
 *
 * Keeps superlist's morphing bottom pill exactly: ONE button holding two rows
 * behind `overflow-hidden`. Collapsed it reads "Pull up a seat"; as the sheet
 * expands, that row slides up and out while the second row slides in from
 * below. Superlist's second row is "Continue with email" — we have no email
 * auth, so the second row becomes the way BACK to the tale, which keeps the
 * button useful in both states instead of morphing into a dead end.
 *
 * (Open question for #201: whether the second row should instead be a skip, a
 * legal line, or nothing at all.)
 */
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';

export const StoryAuthBlock = ({
  progress,
  onCollapse,
}: {
  progress: SharedValue<number>;
  onCollapse: () => void;
}) => {
  const muted = useThemeColor('muted') as string;
  const foreground = useThemeColor('foreground') as string;

  const rStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.1, 0.8], [0, 1], Extrapolation.CLAMP),
    pointerEvents: progress.get() > 0.6 ? 'auto' : 'none',
  }));

  return (
    <Animated.View style={rStyle}>
      <Pressable onPress={onCollapse} className="self-center mb-5 p-1">
        <SymbolView name="chevron.down" size={16} tintColor={muted} />
      </Pressable>

      <AppText
        className="text-foreground/90 text-[24px] text-center"
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        The fire&apos;s already lit.
      </AppText>
      <AppText className="text-foreground/45 text-[13px] leading-6 text-center mt-3 mb-7 px-4">
        Sign in so it&apos;s still burning when you come back.{'\n'}
        Nothing you say here is tied to your name.
      </AppText>

      <View className="gap-3 px-6">
        <Pressable className="flex-row h-12 items-center justify-center gap-3 rounded-full border border-border bg-surface-secondary">
          <SymbolView name="globe" size={17} tintColor={foreground} />
          <AppText className="text-foreground/90 text-[15px]">Continue with Google</AppText>
        </Pressable>
        <Pressable className="flex-row h-12 items-center justify-center gap-3 rounded-full border border-border bg-surface-secondary">
          <SymbolView name="apple.logo" size={17} tintColor={foreground} />
          <AppText className="text-foreground/90 text-[15px]">Continue with Apple</AppText>
        </Pressable>
      </View>
    </Animated.View>
  );
};

/**
 * Superlist's two-row morph. Row one exits upward, row two enters from below,
 * both driven off the same expansion progress.
 */
export const MorphingSeatButton = ({
  progress,
  onExpand,
  onCollapse,
}: {
  progress: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
}) => {
  const accent = useThemeColor('accent') as string;

  const rTopRow = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [0, -42], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.get(), [0, 0.7], [1, 0], Extrapolation.CLAMP),
  }));

  const rBottomRow = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [42, 0], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.get(), [0.3, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const handlePress = () => {
    if (progress.get() > 0.5) onCollapse();
    else onExpand();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ borderCurve: 'continuous' }}
      className="h-12 mx-6 mt-4 items-center justify-center rounded-full border border-accent/25 bg-accent/10 overflow-hidden"
    >
      <Animated.View className="flex-row items-center gap-2" style={rTopRow}>
        <SymbolView name="person" size={15} tintColor={accent} />
        <AppText className="text-accent text-[15px]">Pull up a seat</AppText>
      </Animated.View>
      <Animated.View className="flex-row items-center gap-2 -mt-5" style={rBottomRow}>
        <SymbolView name="flame" size={15} tintColor={accent} />
        <AppText className="text-accent text-[15px]">Back to the fire</AppText>
      </Animated.View>
    </Pressable>
  );
};
