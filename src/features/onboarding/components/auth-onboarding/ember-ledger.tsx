/**
 * The Xolace+ beat's artifact: your nights as a strip of embers.
 *
 * This is the second place in the deck where a card comes back (the first is
 * `ProofWell`), and for the same reason: an artifact needs an edge to read as
 * an artifact. It earns the exception by doing the one thing a sentence about
 * pricing cannot — SHOWING the gate before the user ever hits it.
 *
 *     [flame] YOUR NIGHTS
 *     ▁▃▂▅▃▂▄▁▃▅▂▃▄▂ │ ▄▂▅▃▂▄▃▅
 *      kept by Xolace+   30 days · free
 *
 * The strip starts with the past dark and the recent window lit — which is
 * literally what a free account holds. Then the dark half relights, oldest
 * last, and the caption under it warms with the final bar.
 *
 * THE 30 IS NOT DECORATION. It is `FREE_TIMELINE_WINDOW_DAYS` in
 * `convex/sessions.ts` — the timeline history window, and nothing else. If
 * that constant is retuned this copy is wrong, the same way the timeline
 * banner's would be — keep them together.
 */
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import { useDeckColor } from './deck-color';

const FLAME_ICON = {
  ios: 'flame',
  android: 'local_fire_department',
  web: 'local_fire_department',
} as const;

/**
 * Bar heights as a fraction of the strip, oldest first. Hand-set rather than
 * random: a real month has quiet stretches and loud nights, and a uniform
 * or evenly-jittered strip reads as a loading skeleton instead of a life.
 */
const PAST = [0.35, 0.62, 0.28, 0.8, 0.45, 0.3, 0.66, 0.24, 0.5, 0.85, 0.34, 0.55, 0.7, 0.4];
const RECENT = [0.58, 0.32, 0.9, 0.46, 0.3, 0.68, 0.42, 0.76];

const STRIP = 46;
/** Time between two bars relighting. Slow enough to read as counting back. */
const SWEEP = 52;
/** Held until the beat's own text has landed (see STEP/DUR in `plus-beat`). */
const RELIGHT = 900;

const Bar = ({ height, color, opacity }: { height: number; color: string; opacity: number }) => (
  <View className="flex-1 justify-end" style={{ height: STRIP }}>
    <View style={{ height: STRIP * height, backgroundColor: color, opacity, borderRadius: 3 }} />
  </View>
);

export const EmberLedger = () => {
  const ember = useDeckColor('ember');
  const foreground = useDeckColor('foreground');
  const reduced = useReducedMotion();

  // Oldest bar is leftmost, so the sweep runs right-to-left: it reaches BACK
  // in time from the free window. Reversing this makes it read as new nights
  // arriving, which is the free product, not the paid one.
  const relight = (index: number) =>
    reduced ? undefined : FadeIn.delay(RELIGHT + (PAST.length - 1 - index) * SWEEP).duration(420);

  return (
    <View
      className="rounded-[26px] border px-5 py-5 gap-4"
      style={{ borderColor: `${ember}33`, backgroundColor: `${ember}0d` }}
    >
      <View className="flex-row items-center gap-2">
        <SymbolView name={FLAME_ICON} size={13} tintColor={ember} type="hierarchical" />
        <AppText className="text-ember/70 text-[10px] uppercase" style={{ letterSpacing: 2 }}>
          Your nights
        </AppText>
      </View>

      <View className="flex-row items-end gap-2.5">
        <View className="flex-[14] flex-row items-end gap-[3px]">
          {PAST.map((height, index) => (
            <View key={index} className="flex-1">
              <Bar height={height} color={foreground} opacity={0.14} />
              {/* The lit copy rides on top of the dim one rather than
                  animating a color: `FadeIn` drives the view's own opacity to
                  1, so the ember alpha has to live on the child or the bar
                  lands at full strength and the strip flares. */}
              <Animated.View entering={relight(index)} className="absolute inset-0">
                <Bar height={height} color={ember} opacity={0.92} />
              </Animated.View>
            </View>
          ))}
        </View>

        {/* The gate itself, drawn as one hairline. Everything left of it is
            what a free account loses; everything right of it is what it keeps. */}
        <View style={{ width: 1, height: STRIP, backgroundColor: `${foreground}26` }} />

        <View className="flex-[8] flex-row items-end gap-[3px]">
          {RECENT.map((height, index) => (
            <Bar key={index} height={height} color={ember} opacity={0.92} />
          ))}
        </View>
      </View>

      {/* One row, not two columns under their own halves. Column-aligned, the
          right caption wraps at any sane tracking and its second line drops
          below the left one — two captions of the same rank sitting on
          different baselines, which reads as a mistake before it reads as a
          label. Justified to the edges it still lands under the half it names. */}
      <View className="flex-row items-baseline justify-between gap-3">
        <Animated.View
          entering={reduced ? undefined : FadeIn.delay(RELIGHT + PAST.length * SWEEP).duration(500)}
        >
          <AppText className="text-ember/85 text-[10px] uppercase" style={{ letterSpacing: 1.4 }}>
            Kept by Xolace+
          </AppText>
        </Animated.View>
        <AppText className="text-foreground/45 text-[10px] uppercase" style={{ letterSpacing: 1.4 }}>
          30 days · free
        </AppText>
      </View>
    </View>
  );
};
