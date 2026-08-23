/**
 * The Xolace+ beat's visual: scattered points, then the line through them.
 *
 *        ·        ·                              ·
 *     ●                                       ●
 *        ●     ●                        ●
 *              ·     ●     ●      ·
 *
 *     → then a line finds the seven that were never noise
 *
 * NOT A CHART AND NOT A SCREENSHOT. Every other artifact in the deck either
 * holds up a real in-app surface (`ProofWell`) or shows the character; this
 * one is a diagram of an idea, because the thing being sold is an idea: you
 * are standing inside your own pattern, which is the one position from which
 * it cannot be seen. Dots are what a person has — individual days they lived
 * through. The line is what only exists once something reads across all of
 * them. That is the entire definition of an insight, drawn.
 *
 * THE NOISE DOTS STAY DIM AND STAY PUT. Four points are deliberately off the
 * curve and never light up. A line that swallows every dot says "we will
 * explain all of you", which is both a lie and the exact clinical overreach
 * the product refuses. Some of it stays unexplained. That is honest, and it
 * is why the lit ones read as a finding rather than a decoration.
 *
 * The curve dips before it climbs. Not chosen to be cheerful — chosen because
 * a monotonic line is a trend and a valley is a story, and the beat promises
 * the second one ("what keeps circling back, what's quietly easing").
 *
 * Three fading layers rather than an animated stroke: `strokeDashoffset` on
 * `react-native-svg` needs animated props per path and is the sort of thing
 * this deck has already been rescued from twice on Android (#204). A fade is
 * what every other reveal in the deck uses, so it also matches the cadence.
 */
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { useDeckColor } from './deck-color';

/** Viewbox units. The component scales to whatever width it is given. */
const W = 100;
const H = 40;

/**
 * The seven that turn out to be a shape — a dip and a recovery, read left to
 * right. Hand-placed: an even curve reads as a function plot, and the point is
 * that this came out of a life, not a formula.
 */
const SIGNAL = [
  [6, 14],
  [20, 22],
  [33, 30],
  [46, 33],
  [59, 28],
  [73, 18],
  [88, 9],
];

/** Off the curve, and they stay that way. See the note above. */
const NOISE = [
  [14, 34],
  [40, 8],
  [66, 36],
  [81, 30],
];

/** After the beat's own text has landed (see STEP/DUR in `plus-beat`). */
const FIND = 780;

export const PatternLine = ({ height = 116 }: { height?: number }) => {
  const ember = useDeckColor('ember');
  const foreground = useDeckColor('foreground');
  const reduced = useReducedMotion();

  const points = SIGNAL.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <View style={{ height }} pointerEvents="none">
      {/* Layer 1 — everything a person actually has: undifferentiated days. */}
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[...SIGNAL, ...NOISE].map(([x, y]) => (
          <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} fill={foreground} opacity={0.22} />
        ))}
      </Svg>

      {/* Layer 2 — the reading across them. Deliberately thin and low-alpha:
          an insight that arrives as a bold stroke is a diagnosis, and this
          product does not make those. */}
      <Animated.View
        entering={reduced ? undefined : FadeIn.delay(FIND).duration(1100)}
        className="absolute inset-0"
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Polyline
            points={points}
            fill="none"
            stroke={ember}
            strokeWidth={0.7}
            strokeOpacity={0.55}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {/* Layer 3 — the same seven dots, now warm. Drawn as a separate layer
          over the dim ones rather than by re-colouring them: `FadeIn` drives
          its view's opacity to 1 and would overwrite any alpha set alongside
          it, and two Svgs with one viewBox register exactly. */}
      <Animated.View
        entering={reduced ? undefined : FadeIn.delay(FIND + 220).duration(900)}
        className="absolute inset-0"
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {SIGNAL.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.7} fill={ember} opacity={0.9} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
};
