/**
 * PROTOTYPE — throwaway. Ticket #200.
 *
 * The idea this file exists to test: the fire is not a per-slide illustration,
 * it is ONE continuous thing the deck moves over. Mounted once, behind every
 * beat, and the carousel acts as a camera — the fire drops and dims when the
 * words need the screen, and flares back when the beat is about the fire
 * staying lit. Nothing cuts, so the deck reads as one place rather than six
 * pages about a place.
 *
 * It is also the cheap version: one decode, one texture, one loop for the
 * whole deck instead of six mounts.
 *
 * FRAMING, keyed to `STORY_BEATS` order:
 *   0 dusk      close and large — the fire is the subject
 *   1 vent      settles, holds
 *   2 mirror    lowest + dimmest — the words own the screen
 *   3 proof     returns to mid; the beat is about other fires out there
 *   4 xolacers  mid, steady
 *   5 plus      flares, brightest — "the fire stays lit"
 */
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { HearthVideo } from './slide1/hearth-video';
import { SkyArc } from './sky-arc';
import { STORY_BEATS } from './story-slides';

/** One keyframe per beat. Values are interpolated continuously between them. */
const SCALE = [1.16, 1.08, 1.0, 1.06, 1.06, 1.22];
const RISE = [0, 26, 74, 34, 30, -18];
const BRIGHT = [1, 0.86, 0.6, 0.82, 0.84, 1];

const BLEND_SCREEN = { mixBlendMode: 'screen' } as const;

/** How hard the top scrim presses, per beat. It has to relax as the sky lifts,
 *  or a black bar sits on top of the dawn. */
const TOP_SCRIM_AT = [1, 1, 0.9, 0.7, 0.5, 0.28];

export const HearthBackdrop = ({
  scrollX,
  width,
  sky = false,
  dawnCeiling = 1,
}: {
  scrollX: SharedValue<number>;
  width: number;
  /** Option B. Off = the deck stays night the whole way (option A). */
  sky?: boolean;
  dawnCeiling?: number;
}) => {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  // The looped list appends a duplicate of beat 0 at the tail, so the camera
  // has to travel back to the opening framing rather than jumping. Ramps are
  // built here, on the JS thread — a worklet may not call a plain closure.
  const stops = [...SCALE.map((_, i) => width * i), width * STORY_BEATS.length];
  const scale = [...SCALE, SCALE[0]];
  const rise = [...RISE, RISE[0]];
  const bright = [...BRIGHT, BRIGHT[0]];
  const topScrim = [...TOP_SCRIM_AT, TOP_SCRIM_AT[0]];

  const rFire = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.get(), stops, bright, Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollX.get(), stops, rise, Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.get(), stops, scale, Extrapolation.CLAMP) },
    ],
  }));

  const rTopScrim = useAnimatedStyle(() => ({
    opacity: sky ? interpolate(scrollX.get(), stops, topScrim, Extrapolation.CLAMP) : 1,
  }));

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      {sky ? <SkyArc scrollX={scrollX} width={width} dawnCeiling={dawnCeiling} /> : null}

      {/* `screen` drops the clip's black to transparent so the flames composite
          ONTO the sky instead of punching an opaque hole in it. Without it the
          dawn arc is invisible behind the fire — the whole option dies here. */}
      <View style={[{ flex: 1 }, sky ? BLEND_SCREEN : null]}>
        <Animated.View style={[{ flex: 1 }, rFire]}>
          <HearthVideo width={screenWidth} height={screenHeight} />
        </Animated.View>
      </View>

      {/* Reads the top third back to true black so type never sits on texture.
          Without it the fire's own haze lifts the background and the words go
          soft — the single biggest legibility problem with real footage. */}
      <Animated.View
        style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: '55%' }, rTopScrim]}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.88)', 'rgba(0,0,0,0.30)', 'transparent']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Variant E bottom-anchors the beat, so the words land ON the brightest
          part of the fire. This is the legibility floor: enough to hold 4.5:1
          without reading as a black box over the flames. */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.62)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.46, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%' }}
      />
    </View>
  );
};
