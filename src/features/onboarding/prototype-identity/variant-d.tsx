/**
 * PROTOTYPE — throwaway. Ticket #198. Variant D — "The Tale, Told on Cards".
 *
 * The onboarding as a story told in six beats, WITH superlist's card. The card
 * earns its place here by acting as the page of a storybook: one beat per
 * page, an illustration well waiting for real art, and a chapter mark so you
 * always know where in the tale you are.
 *
 * Unlike superlist the card never changes colour — it stays the same warm
 * surface and the ember chapter mark carries the identity. E is this same tale
 * with the card removed; that is the only difference between them.
 */
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';
import { DuskDriftBackdrop } from '@/src/features/onboarding/components/dusk-drift-backdrop';
import { StoryShell } from './story-shell';
import type { StoryBeat } from './story-slides';

const BeatCard = ({
  beat,
  index,
  width,
  scrollX,
}: {
  beat: StoryBeat;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
}) => {
  const ember = useThemeColor('ember' as 'accent') as string;

  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    return {
      transform: [
        { translateY: interpolate(scrollX.get(), range, [10, 0, 10], Extrapolation.CLAMP) },
        { scale: interpolate(scrollX.get(), range, [0.96, 1, 0.96], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[{ width }, rStyle]} className="px-6 py-3">
      <View className="flex-1 rounded-[30px] border border-border bg-surface px-8 pb-10 pt-9 overflow-hidden">
        {/* Chapter mark — absent on the opening beat, which sells nothing. */}
        <View className="flex-row items-center gap-2.5 h-5">
          {beat.label ? (
            <>
              <SymbolView name={beat.symbol} size={15} tintColor={ember} type="hierarchical" />
              <AppText className="text-ember/75 text-[10.5px] uppercase" style={{ letterSpacing: 2.2 }}>
                {beat.label}
              </AppText>
            </>
          ) : null}
        </View>

        <AppText
          className="text-foreground/92 text-[28px] leading-[40px] mt-7"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          {beat.beat}
        </AppText>

        {/* Illustration well — real art lands here (asset briefs are #200). */}
        <View className="flex-1 my-7 rounded-[22px] border border-border/60 bg-surface-secondary/40" />

        <AppText className="text-foreground/45 text-[13.5px] leading-6">{beat.aside}</AppText>
      </View>
    </Animated.View>
  );
};

export const VariantD = () => (
  <StoryShell
    backdrop={<DuskDriftBackdrop />}
    renderBeat={({ beat, index, width, scrollX }) => (
      <BeatCard beat={beat} index={index} width={width} scrollX={scrollX} />
    )}
  />
);
