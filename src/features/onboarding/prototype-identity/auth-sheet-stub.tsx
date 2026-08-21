/**
 * PROTOTYPE — throwaway. Ticket #198.
 *
 * A deliberately plain sign-in block so the EXPAND MOTION can be judged.
 * Auth-sheet content & interaction design is ticket #201 — nothing here is a
 * proposal for that. Buttons are inert: no Clerk, no navigation. The Google
 * mark is a `globe` placeholder (no SF Symbol exists; @expo/vector-icons isn't
 * a dependency here).
 */
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';
import type { ExpandController } from './use-expand-gesture';

type Tone = 'surface' | 'bare' | 'paper';

const TONE_CLASS: Record<Tone, string> = {
  // A — the sheet is another face of the same room.
  surface: 'rounded-t-[32px] border-t border-border bg-surface',
  // B — no sheet at all; you are simply closer to the fire.
  bare: 'bg-transparent',
  // C — a paper card lifted onto the dark ground.
  paper: 'mx-4 mb-4 rounded-[24px] bg-foreground',
};

export const AuthSheetStub = ({ controller, tone }: { controller: ExpandController; tone: Tone }) => {
  const insets = useSafeAreaInsets();
  const { progress, collapse } = controller;
  const onPaper = tone === 'paper';
  const iconColor = useThemeColor(onPaper ? 'background' : 'foreground') as string;
  const muted = useThemeColor('muted') as string;

  const rStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.15, 0.75], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [56, 0], Extrapolation.CLAMP) }],
    pointerEvents: progress.get() > 0.6 ? 'auto' : 'none',
  }));

  const btn = onPaper
    ? 'flex-row h-12 items-center justify-center gap-3 rounded-[14px] bg-background'
    : 'flex-row h-12 items-center justify-center gap-3 rounded-full border border-border bg-surface-secondary';
  const btnText = onPaper ? 'text-foreground text-[15px]' : 'text-foreground/90 text-[15px]';

  return (
    <Animated.View
      className={`absolute bottom-0 left-0 right-0 px-6 pt-5 ${TONE_CLASS[tone]}`}
      style={[{ paddingBottom: insets.bottom + 22 }, rStyle]}
    >
      <Pressable onPress={collapse} className="self-center mb-4 p-1">
        <SymbolView name="chevron.down" size={16} tintColor={muted} />
      </Pressable>

      <AppText
        className={`${onPaper ? 'text-background' : 'text-foreground/90'} text-[20px] text-center`}
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        Pull up a seat.
      </AppText>
      <AppText className={`${onPaper ? 'text-background/55' : 'text-foreground/45'} text-[13px] text-center mt-2 mb-6`}>
        Your account only keeps the fire lit{'\n'}across your devices. Nothing else.
      </AppText>

      <View className="gap-3">
        <Pressable className={btn}>
          <SymbolView name="globe" size={17} tintColor={iconColor} />
          <AppText className={btnText}>Continue with Google</AppText>
        </Pressable>
        <Pressable className={btn}>
          <SymbolView name="apple.logo" size={17} tintColor={iconColor} />
          <AppText className={btnText}>Continue with Apple</AppText>
        </Pressable>
      </View>
    </Animated.View>
  );
};
