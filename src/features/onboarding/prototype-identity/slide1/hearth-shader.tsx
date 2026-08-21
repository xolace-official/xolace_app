/**
 * PROTOTYPE — throwaway. Ticket #200, slide 1 lab.
 *
 * The code route, done properly this time. My first stand-in was stacked
 * radial gradients, which is why it read as an orb — that was a bad
 * implementation, not evidence against shaders. This is domain-warped fbm
 * noise scrolling upward through a vertical mask: actual flame structure.
 *
 * What this buys over a baked video:
 *   - tints from `--ember`, so it is correct in all ten themes (a video is
 *     amber no matter which theme the user picked)
 *   - zero asset weight, resolution independent
 *   - the six-beat brightness ramp becomes one uniform
 * What it costs: GPU time on cheap Android, and it will never be photoreal.
 */
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';

const source = Skia.RuntimeEffect.Make(`
uniform float2 u_res;
uniform float  u_time;
uniform float3 u_ember;
uniform float  u_intensity;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(float2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / u_res;
  float y = 1.0 - uv.y;                       // 0 at the bottom edge
  float cx = abs(uv.x - 0.5) * 2.0;

  // Rising, domain-warped noise — this is what makes it read as fire and
  // not as a gradient. The warp is the whole trick.
  // Higher horizontal frequency + faster rise = separate tongues rather than
  // one smooth plume. The plume look is the failure mode of every noise fire.
  float2 p = float2(uv.x * 5.4, y * 3.4 - u_time * 1.5);
  float n = fbm(p + fbm(p * 2.1) * 0.75);

  float body = smoothstep(1.0, 0.0, cx * 0.98);   // wider: a hearth, not a torch
  float vert = smoothstep(0.38, 0.0, y);          // low — it is a fire you sit at
  // A slow global flicker, the thing a static gradient can never fake.
  float flick = 0.88 + 0.12 * noise(float2(u_time * 2.3, 0.0));
  float flame = pow(max(n * body * vert, 0.0), 1.95) * u_intensity * 4.2 * flick;

  half3 col = half3(u_ember) * half(flame);
  col += half3(1.0, 0.86, 0.62) * half(smoothstep(0.80, 1.30, flame) * 0.85);

  // Ambient spill so the room is lit, not just the flame.
  float glow = exp(-cx * cx * 1.25) * exp(-y * 3.6) * 0.32 * u_intensity;
  col += half3(u_ember) * half(glow);

  return half4(col, 1.0);
}
`)!;

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '').slice(0, 6);
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

export const HearthShader = ({
  width,
  height,
  intensity = 1,
}: {
  width: number;
  height: number;
  intensity?: number;
}) => {
  const clock = useClock();
  const ember = hexToRgb(useThemeColor('ember' as 'accent') as string);

  const uniforms = useDerivedValue(() => ({
    u_res: [width, height],
    u_time: clock.get() / 1000,
    u_ember: ember,
    u_intensity: intensity,
  }));

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Fill>
        <Shader source={source} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
};
