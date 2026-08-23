/**
 * The dawn arc (#200, option B — shipped).
 *
 * The problem this solves: the deck has to be dark (fire only reads as a light
 * source against dark), but the app defaults to `theme: 'system'`, so most
 * first-timers land in a LIGHT app the moment the sheet opens. A black deck
 * cutting to a white app is a jolt, and it hits the common case, not an edge.
 *
 * So rather than fight it: the sky lifts across the six beats. Night at dusk,
 * indigo by the middle, dawn by Xolace+ — and the hand-off into a light app
 * stops being a seam and becomes the point of the story. You arrived at night
 * carrying something; you leave lighter.
 *
 * Dark-mode users don't get the full sunrise — `dawnCeiling` holds them at a
 * faint pre-dawn glow, so their hand-off is equally seamless in the other
 * direction. The arc still happens; it just resolves where THEY are going.
 *
 * Built as three fixed gradients cross-faded on scroll rather than one gradient
 * with animated colors: `LinearGradient`'s `colors` prop is not animatable, and
 * cross-fading opacity is both cheaper and smoother than re-rendering stops.
 */
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { STORY_BEATS } from '@/src/features/onboarding/story-beats';

/** Cool and nearly black. The base layer — never fades, so nothing shows through. */
const NIGHT = ['#070912', '#04050A', '#000000'] as const;
/** Indigo creeping up from the horizon, where the fire already is. */
const PREDAWN = ['#080A14', '#101528', '#1C1A2A'] as const;
/** Warm horizon meeting the fire. Cool above, so it still reads as sky. */
const DAWN = ['#141B33', '#3A3550', '#7A4A38'] as const;

/** Per-beat opacity. Index matches STORY_BEATS order. */
const PREDAWN_AT = [0, 0.12, 0.5, 0.85, 0.9, 0.55];
const DAWN_AT = [0, 0, 0.05, 0.25, 0.55, 1];

export const SkyArc = ({
  scrollX,
  width,
  dawnCeiling = 1,
}: {
  scrollX: SharedValue<number>;
  width: number;
  /** 1 = full sunrise (they're headed into a light app). Lower holds it at dusk. */
  dawnCeiling?: number;
}) => {
  // The looped list repeats beat 0 at the tail, so every ramp must return home.
  const stops = [...PREDAWN_AT.map((_, i) => width * i), width * STORY_BEATS.length];
  const predawn = [...PREDAWN_AT, PREDAWN_AT[0]];
  const dawn = [...DAWN_AT.map((v) => v * dawnCeiling), DAWN_AT[0]];

  const rPredawn = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.get(), stops, predawn, Extrapolation.CLAMP),
  }));

  const rDawn = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.get(), stops, dawn, Extrapolation.CLAMP),
  }));

  return (
    <>
      <LinearGradient colors={NIGHT} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, rPredawn]}>
        <LinearGradient colors={PREDAWN} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, rDawn]}>
        <LinearGradient colors={DAWN} locations={[0, 0.52, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </>
  );
};
