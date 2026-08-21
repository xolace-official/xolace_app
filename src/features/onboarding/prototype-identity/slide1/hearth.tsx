/**
 * PROTOTYPE — throwaway. Ticket #200, slide 1 lab.
 *
 * STAND-IN for the real hero asset. This is layered Skia light plus drifting
 * embers, and it exists so composition can be judged NOW — it is explicitly
 * NOT the shipping visual. The production version swaps this for a graded
 * campfire loop behind the same box (expo-video, already a dependency), and
 * every layout number around it stays put.
 *
 * `scale` lets the three comps share one hearth at different distances:
 * 1 = sitting at the fire, 0.35 = one ember across the room.
 */
import { useEffect } from 'react';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';

const withAlpha = (hex: string, a: number) =>
  `${hex}${Math.round(Math.min(1, Math.max(0, a)) * 255).toString(16).padStart(2, '0')}`;

type Props = {
  width: number;
  height: number;
  /** 0..1 — how close/bright the fire reads. */
  scale?: number;
  /** 0..1 — where the light SOURCE sits vertically. 1 = at the bottom edge. */
  cyRatio?: number;
};

export const Hearth = ({ width, height, scale = 1, cyRatio = 0.995 }: Props) => {
  const ember = useThemeColor('ember' as 'accent') as string;
  const accent = useThemeColor('accent') as string;

  // A fire is never still. This is the single thing that separates a lit room
  // from a gradient, and it is why the shipping asset should be video.
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.set(
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [breath]);

  const coreR = useDerivedValue(() => width * 0.30 * scale * (0.94 + breath.get() * 0.12));
  const cy = height * cyRatio;

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {/* Wide, cool spill — the room, barely there. */}
      <Circle cx={width / 2} cy={cy} r={width * 1.15 * scale}>
        <RadialGradient
          c={vec(width / 2, cy)}
          r={width * 1.15 * scale}
          colors={[withAlpha(accent, 0.16), withAlpha(accent, 0.0)]}
        />
      </Circle>
      {/* Warm body of the firelight. */}
      <Circle cx={width / 2} cy={cy} r={width * 0.78 * scale}>
        <RadialGradient
          c={vec(width / 2, cy)}
          r={width * 0.78 * scale}
          colors={[withAlpha(ember, 0.34), withAlpha(ember, 0.0)]}
        />
      </Circle>
      {/* The hot core, breathing. */}
      <Circle cx={width / 2} cy={cy} r={coreR}>
        <RadialGradient
          c={vec(width / 2, cy)}
          r={coreR}
          colors={[withAlpha(ember, 0.62), withAlpha(ember, 0.0)]}
        />
      </Circle>
    </Canvas>
  );
};
