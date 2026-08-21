/**
 * PROTOTYPE — throwaway. Ticket #200.
 *
 * Reacting to feedback on E's real carousel (not the slide1 comps): most beats
 * leave the whole span from the status bar down to the copy empty — the top
 * scrim reads to true black and the words sit pinned to the bottom, so the
 * "mirror" beat in particular is a near-blank screen with one line of label
 * text at the foot of it.
 *
 * F does NOT touch E or its shared hearth-backdrop — it is a separate
 * composition question, prototyped side by side so E stays the untouched
 * baseline. Two changes, both reusing what already exists rather than
 * commissioning new art:
 *
 * 1. Copy moves from bottom-anchored to vertically centered, so it sits in
 *    the middle of the frame instead of at the very foot of a mostly-empty
 *    deck.
 * 2. The beat's own `symbol` (already drawn small next to the label) is
 *    reused again, huge and barely-there, as a graphic anchor for the space
 *    above the words — filling the dead air with something on-theme instead
 *    of nothing. No new illustration asset, no orb/ember mascot.
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
      {/* The dead-air fix: the same glyph the label already uses, blown up and
          faded almost to nothing, sitting above the words instead of a void. */}
      <View pointerEvents="none" className="items-center mb-8" style={{ opacity: 0.1 }}>
        <SymbolView name={beat.symbol} size={148} tintColor={ember} type="hierarchical" />
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

export const VariantF = ({ sky = false }: { sky?: boolean }) => {
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
