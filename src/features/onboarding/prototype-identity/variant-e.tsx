/**
 * PROTOTYPE — throwaway. Ticket #198. Variant E — "The Tale, Told in the Dark".
 *
 * Identical tale, identical pagination, identical morphing pill as D — the ONE
 * difference is that the card is gone. The beat sits directly on the dark, lit
 * by a hearth below the fold, so the screen reads as the room you are actually
 * in rather than a stack of pages about it.
 *
 * Compare against D to decide the card question on its own merits; everything
 * else is held constant between the two.
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
import { EmberGlow } from './ember-glow';
import { ProofWell } from './proof-well';
import { StoryShell } from './story-shell';
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
  const ember = useThemeColor('ember' as 'accent') as string;

  // No card to slide, so the words themselves resolve out of the dark.
  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    return {
      opacity: interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollX.get(), range, [22, 0, 22], Extrapolation.CLAMP) },
        // Hold the text still horizontally; only the fade carries the change.
        { translateX: interpolate(scrollX.get(), range, [-width * 0.8, 0, width * 0.8], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[{ width }, rStyle]} className="flex-1 justify-end px-9 pb-4">
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

      {/* #200: the proof beat states the claim smaller, then shows the evidence
          under it. Every other beat is the words alone. */}
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

const Hearth = () => (
  <View pointerEvents="none" className="absolute inset-0 items-center justify-end">
    <View style={{ marginBottom: -420 }}>
      <EmberGlow size={760} intensity={0.19} token="ember" />
    </View>
  </View>
);

export const VariantE = () => (
  <StoryShell
    backdrop={<Hearth />}
    renderBeat={({ beat, index, width, scrollX }) => (
      <Beat beat={beat} index={index} width={width} scrollX={scrollX} />
    )}
  />
);
