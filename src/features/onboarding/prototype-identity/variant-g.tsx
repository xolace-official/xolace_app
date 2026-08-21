/**
 * PROTOTYPE — throwaway. Ticket #200.
 *
 * Same fix as F (copy re-centered instead of bottom-anchored, to kill the
 * dead space above it) but reacting to "try real illustration instead of the
 * glyph" — swaps F's blown-up SF Symbol for a small hand-drawn line scene per
 * beat (`beat-illustrations.tsx`). Not E, not F — a third thing to react to.
 */
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { useDeckColor } from './deck-color';

import { AppText } from '@/src/components/shared/app-text';
import { BeatIllustration } from './beat-illustrations';
import { HearthBackdrop } from './hearth-backdrop';
import { ProofWell } from './proof-well';
import { useAppTheme } from '@/src/context/app-theme-context';
import { StoryShell, type Backdrop } from './story-shell';
import type { StoryBeat } from './story-slides';

const Beat = ({
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
  const ember = useDeckColor('ember');

  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    return {
      opacity: interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollX.get(), range, [22, 0, 22], Extrapolation.CLAMP) },
        { translateX: interpolate(scrollX.get(), range, [-width * 0.8, 0, width * 0.8], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[{ width }, rStyle]} className="flex-1 justify-center px-9 pb-16">
      <View pointerEvents="none" className="items-center mb-8" style={{ opacity: 0.55 }}>
        <BeatIllustration beat={beat} color={ember} size={128} />
      </View>

      <View className="flex-row items-center gap-2.5 h-5 mb-6">
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
        className={
          beat.kind === 'proof'
            ? 'text-foreground/95 text-[24px] leading-[34px]'
            : 'text-foreground/95 text-[32px] leading-[45px]'
        }
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        {beat.beat}
      </AppText>

      {beat.kind === 'proof' ? (
        <View className="mt-5">
          <ProofWell />
        </View>
      ) : null}

      <AppText className="text-foreground/42 text-[14px] leading-6 mt-5 pr-4">{beat.aside}</AppText>
    </Animated.View>
  );
};

export const VariantG = ({ sky = false }: { sky?: boolean }) => {
  const { isDark } = useAppTheme();

  const backdrop: Backdrop = ({ scrollX, width }) => (
    <HearthBackdrop scrollX={scrollX} width={width} sky={sky} dawnCeiling={isDark ? 0.4 : 1} />
  );

  return (
    <StoryShell
      backdrop={backdrop}
      renderBeat={({ beat, index, width, scrollX }) => (
        <Beat beat={beat} index={index} width={width} scrollX={scrollX} />
      )}
    />
  );
};
