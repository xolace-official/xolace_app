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
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useDeckColor } from './deck-color';

import { AppText } from '@/src/components/shared/app-text';
import { BeatIllustration } from './beat-illustrations';
import { HearthBackdrop } from './hearth-backdrop';
import { ProofWell } from './proof-well';
import { useAppTheme } from '@/src/context/app-theme-context';
import { StoryShell, type Backdrop } from './story-shell';
import type { StoryBeat } from './story-slides';

/**
 * Real illustration is the picked direction (#200) — line art stays only where
 * a real asset doesn't exist yet. `dusk` has one (`flux-campfire.png`), a calm
 * figure sitting alone by a small lit fire — which the shared "it's still
 * there / carried all day" copy doesn't match (that's about weight, this
 * image is about stillness). Overridden here, not in `story-slides.ts`, so
 * Variant E's copy stays exactly as locked.
 */
const DUSK_COPY = {
  beat: 'You sit by the fire,\nalone for now.',
  aside: 'The flames help you see what you’re carrying.',
};

/**
 * The old plus-beat copy ("the fire stays lit" / "your patterns, your
 * mirror's voice, a line each day") was mood with nothing to actually sell —
 * the last beat before the ask, and it asked for nothing. No hard paywall
 * (Plus never blocks the free product), but this is the one spot in the tale
 * built to plant the offer. Made concrete: what Plus is, that it's not a
 * gate, and the founding-pricing hook while it's live.
 */
const PLUS_COPY = {
  beat: 'The fire\nstays lit for you.',
  aside:
    'Full history, your mirror in its own voice, a line that’s really yours each day. Free to start — Xolace+ is there when you want more.',
  tag: 'Founding pricing · while it lasts',
};

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
  const isDusk = beat.id === 'dusk';
  const isPlus = beat.id === 'plus';

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
        {isDusk ? DUSK_COPY.beat : isPlus ? PLUS_COPY.beat : beat.beat}
      </AppText>

      {beat.kind === 'proof' ? (
        <View className="mt-5">
          <ProofWell />
        </View>
      ) : null}

      <AppText className="text-foreground/42 text-[14px] leading-6 mt-5 pr-4">
        {isDusk ? DUSK_COPY.aside : isPlus ? PLUS_COPY.aside : beat.aside}
      </AppText>

      {isPlus ? (
        <AppText
          className="text-ember/75 text-[10.5px] uppercase mt-4"
          style={{ letterSpacing: 2 }}
        >
          {PLUS_COPY.tag}
        </AppText>
      ) : null}
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
