/**
 * One beat of the tale: illustration, chapter mark, the line, and the aside.
 * Cardless by #198 — words on the dark, with the fire behind them — except
 * the `proof` beat, which holds up a real artifact instead (`ProofWell`).
 *
 * The slide's own translate is deliberately slower than the list's (0.8x), so
 * the copy trails the swipe rather than moving locked to the finger.
 */
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import type { StoryBeat } from '@/src/features/onboarding/story-beats';
import { BeatIllustration } from './beat-illustrations';
import { ProofWell } from './proof-well';
import { useDeckColor } from './deck-color';

export const StoryBeatSlide = ({
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
  // `dusk` is the one beat with a real illustration asset; the rest still run
  // on the placeholder line art until #203 lands theirs.
  const isDusk = beat.id === 'dusk';

  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    return {
      opacity: interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollX.get(), range, [22, 0, 22], Extrapolation.CLAMP) },
        {
          translateX: interpolate(
            scrollX.get(),
            range,
            [-width * 0.8, 0, width * 0.8],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[{ width }, rStyle]} className="flex-1 justify-center px-9 pb-16">
      <View pointerEvents="none" className="items-center mb-8" style={{ opacity: isDusk ? 1 : 0.55 }}>
        {isDusk ? (
          <Image
            source={require('@/assets/images/flux/flux-campfire.png')}
            style={{ width: 176, height: 176 }}
            contentFit="contain"
          />
        ) : (
          <BeatIllustration beat={beat} color={ember} size={128} />
        )}
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

      {beat.tag ? (
        <AppText className="text-ember/75 text-[10.5px] uppercase mt-4" style={{ letterSpacing: 2 }}>
          {beat.tag}
        </AppText>
      ) : null}
    </Animated.View>
  );
};
