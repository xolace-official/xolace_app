/**
 * One beat of the tale: illustration, chapter mark, the line, and the aside.
 * Cardless by #198 — words on the dark, with the fire behind them — except
 * the `proof` beat, which holds up a real artifact instead (`ProofWell`).
 *
 * The slide's own translate is deliberately slower than the list's (0.8x), so
 * the copy trails the swipe rather than moving locked to the finger.
 */
import type { ReactElement } from 'react';
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import type { StoryBeat } from '@/src/features/onboarding/story-beats';
import { BeatIllustration } from './beat-illustrations';
import { CoverBeat } from './cover-beat';
import { MirrorBeat } from './mirror-beat';
import { VentBeat } from './vent-beat';
import { XolacersBeat } from './xolacers-beat';
import { PlusBeat } from './plus-beat';
import { ProofWell } from './proof-well';
import { useDeckColor } from './deck-color';

/** Beats that lay themselves out. Anything absent here uses the stack below. */
const BESPOKE: Partial<Record<string, (p: { beat: StoryBeat }) => ReactElement>> = {
  cover: CoverBeat,
  mirror: MirrorBeat,
  vent: VentBeat,
  xolacers: XolacersBeat,
  plus: PlusBeat,
};

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
  // Reduced motion keeps the crossfade (it explains which beat you're on) and
  // drops the trailing parallax, which is the part that reads as movement.
  const reduced = useReducedMotion();

  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    const opacity = interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP);
    if (reduced) return { opacity, transform: [] };
    return {
      opacity,
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

  // KNOWN, ACCEPTED: every beat's `entering` fires at deck MOUNT, because the
  // six-item FlatList mounts all slides at once — so a beat reached 19s later
  // is reached with its choreography already finished. Gating the mount on
  // scroll position fixes that and was tried; it also leaves the whole deck
  // blank whenever `scrollX` and the list's real offset disagree (a Fast
  // Refresh with the deck parked off index 0 reproduces it every time). A
  // blank deck in the sign-up funnel is not a trade worth an unseen fade, and
  // every beat's FINAL state is complete on its own. Fix it by driving the
  // reveals off `scrollX` instead of `entering` — never by unmounting slides.

  // Beats that own their own composition still ride the deck's shared
  // parallax, so the swipe feels the same leaving them as on every other beat.
  const Bespoke = BESPOKE[beat.kind ?? 'tale'];
  if (Bespoke) {
    return (
      <Animated.View style={[{ width }, rStyle]} className="flex-1">
        <Bespoke beat={beat} />
      </Animated.View>
    );
  }

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

      {beat.tag ? (
        <AppText className="text-ember/75 text-[10.5px] uppercase mt-4" style={{ letterSpacing: 2 }}>
          {beat.tag}
        </AppText>
      ) : null}
    </Animated.View>
  );
};
