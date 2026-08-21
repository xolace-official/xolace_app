/**
 * PROTOTYPE — throwaway. Ticket #198.
 *
 * A soft radial firelight. Sized in px, drawn around its own centre so the
 * caller can position/animate it with a parent transform.
 */
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { useDeckColor } from './deck-color';

type EmberGlowProps = {
  /** Diameter of the glow in px. */
  size: number;
  /** 0..1 — peak alpha at the centre. */
  intensity?: number;
  /** Token to tint with. `ember` = firelight, `accent` = twilight. */
  token?: 'ember' | 'accent';
};

/** hex + 2-digit alpha — useThemeColor resolves oklch tokens to 6-digit hex. */
const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')}`;

export const EmberGlow = ({ size, intensity = 0.5, token = 'ember' }: EmberGlowProps) => {
  const color = useDeckColor(token);
  const r = size / 2;

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Circle cx={r} cy={r} r={r}>
        <RadialGradient
          c={vec(r, r)}
          r={r}
          colors={[withAlpha(color, intensity), withAlpha(color, intensity * 0.35), withAlpha(color, 0)]}
          positions={[0, 0.45, 1]}
        />
      </Circle>
    </Canvas>
  );
};
