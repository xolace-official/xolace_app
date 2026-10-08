// PROTOTYPE (#491) — ported from sample-codes/clarity-main ui/glass-surface +
// session/tick-gauge, re-mapped to Xolace tokens.
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import Animated, { Extrapolation, interpolate, interpolateColor, useAnimatedProps, type SharedValue } from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";

/** Frosted surface. Never put it under an animated opacity — the blur stops rendering. */
export function GlassSurface({ children, radius = 32, style }: { children?: ReactNode; radius?: number; style?: StyleProp<ViewStyle> }) {
  const surface = useTokenColor("surface");
  const shape: ViewStyle = { borderRadius: radius, borderCurve: "continuous", overflow: "hidden" };
  if (!isLiquidGlassAvailable()) {
    return <View style={[shape, { backgroundColor: surface + "CC" }, style]}>{children}</View>;
  }
  return (
    <GlassView glassEffectStyle="regular" style={[shape, { backgroundColor: surface + "40" }, style]}>
      {children}
    </GlassView>
  );
}

const AnimatedLine = Animated.createAnimatedComponent(Line);

type GaugeProps = {
  ticks: number;
  startAngle: number; // screen degrees, 0 = right, 90 = down
  sweep: number;
  radius: number;
  tickLength: number;
  tickWidth: number;
  progress: SharedValue<number>; // 0..1
  fill: string;
  track: string;
  mark?: number | null; // 0..1 — this tick is drawn in --foreground (the person's usual)
  children?: ReactNode;
};

export function TickGauge({ ticks, startAngle, sweep, radius, tickLength, tickWidth, progress, fill, track, mark, children }: GaugeProps) {
  const fg = useTokenColor("foreground");
  const markAt = mark != null ? Math.round(mark * (ticks - 1)) : -1;
  const size = radius * 2 + tickWidth + tickLength * 0.5; // room for the taller mark
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {Array.from({ length: ticks }, (_, i) => {
          const a = ((startAngle + (sweep / (ticks - 1)) * i) * Math.PI) / 180;
          if (i === markAt) {
            const out = radius + tickLength * 0.25;
            return <Line key={i} stroke={fg} strokeWidth={tickWidth} strokeLinecap="round"
              x1={c + Math.cos(a) * (radius - tickLength)} y1={c + Math.sin(a) * (radius - tickLength)}
              x2={c + Math.cos(a) * out} y2={c + Math.sin(a) * out} />;
          }
          return (
            <Tick key={i} i={i} n={ticks} progress={progress} fill={fill} track={track} width={tickWidth}
              x1={c + Math.cos(a) * (radius - tickLength)} y1={c + Math.sin(a) * (radius - tickLength)}
              x2={c + Math.cos(a) * radius} y2={c + Math.sin(a) * radius} />
          );
        })}
      </Svg>
      <View style={{ position: "absolute", inset: 0 }} className="items-center justify-center" pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

type TickProps = { i: number; n: number; progress: SharedValue<number>; fill: string; track: string; width: number; x1: number; y1: number; x2: number; y2: number };

function Tick({ i, n, progress, fill, track, width, ...xy }: TickProps) {
  const animatedProps = useAnimatedProps(() => {
    const on = interpolate(progress.get() * n - i, [0, 1], [0, 1], Extrapolation.CLAMP);
    return { stroke: interpolateColor(on, [0, 1], [track, fill]) };
  });
  return <AnimatedLine {...xy} strokeWidth={width} strokeLinecap="round" animatedProps={animatedProps} />;
}
