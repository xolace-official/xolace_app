// PROTOTYPE — issue #246. Two candidate background washes, side by side.
// Delete with the rest of src/features/reflect/prototype.
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Blur, Canvas, Fill, SweepGradient, vec } from "@shopify/react-native-skia";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";

/** Uniwind's built-in gradient classes — no JS, no extra dependency. */
export const UniwindWash = () => (
  <View
    pointerEvents="none"
    className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-b from-background via-surface-secondary to-background"
  />
);

/**
 * Skia sweep + blur: the spec's fallback for when the linear wash reads flat.
 * Structure lifted from the Dot sample in components/extras/sample-codes.
 *
 * Three things make a sweep read as light on a surface rather than as paint:
 *
 * 1. The centre must sit near the middle of the screen. A sweep assigns colour
 *    by ANGLE, so a centre pushed into a corner gives the wedge pointing at the
 *    bulk of the screen almost all the visible area — the other stops compress
 *    into a corner you can't see. The earlier centre at (0.2w, 0.78h) is why
 *    raising the stop amplitude changed so little.
 * 2. Enough stops to fill the turn. Dot uses nine; six leaves each stop a 60°
 *    wedge that a 55px blur mostly averages away.
 * 3. Most of the turn should be quiet. Dot spends ~6 stops on colour and 3 on
 *    near-white, which is what makes it read as a lit corner instead of a tint.
 *
 * Colours come from tokens, never hex: `--accent` is the only one that actually
 * moves per palette (`--ember` is the same orange in all eleven — issue #246,
 * story 19), so accent at varying alpha carries the colour and the surface
 * ramp carries the falloff into the quiet side.
 */
export const SkiaWash = () => {
  const { width, height } = useWindowDimensions();
  const background = useTokenColor("background");
  const surface = useTokenColor("surface-secondary");
  const surfaceTertiary = useTokenColor("surface-tertiary");
  const accent = useTokenColor("accent");

  return (
    <Canvas style={[styles.canvas, { width, height }]} pointerEvents="none">
      <Fill>
        <SweepGradient
          c={vec(width / 2, height / 2)}
          // Nine stops, 40° apart, starting at 3 o'clock and running clockwise.
          // The bottom half rises to a peak straight down and falls off evenly
          // — an unordered ramp (the earlier 59/40/73/38) reads as two blobs
          // with a dip between them, not as fill. The top is quiet but not
          // flat: one 8% accent stop straight up keeps it off the floor.
          colors={[
            accent + "33", //   0° right
            accent + "4D", //  40° down-right
            accent + "73", //  80° down — peak
            accent + "4D", // 120° down-left
            accent + "26", // 160° left
            surfaceTertiary, // 200° up-left
            surface, //        240°
            accent + "14", // 280° up — the lift
            background, //     320° up-right
          ]}
        />
        <Blur blur={55} />
      </Fill>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: { position: "absolute", top: 0, left: 0 },
});
