// PROTOTYPE (#491) — open-bottom arc ring. The gap at the bottom holds an icon
// (ref: "Growth Area" grid); optional knob at the tip and baseline tick.
import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, Line, Pattern, RadialGradient, Stop } from "react-native-svg";
import { SymbolView } from "expo-symbols";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import type { Icon } from "./mock";

const SWEEP = 300; // degrees of arc; the remaining 60° is the bottom gap
const START = 90 + (360 - SWEEP) / 2; // svg angles run clockwise from +x

type Props = {
  size: number;
  stroke?: number;
  value: number | null; // null = no fill (warming, or free tier hiding the number)
  baseline?: number | null;
  tone?: "accent" | "ember" | "muted";
  dashed?: boolean;
  knob?: boolean;
  inner?: boolean; // filled, dotted disc inside the arc (ref: "vitality" dial)
  icon?: Icon;
  children?: ReactNode;
};

export function SteadinessRing({
  size, stroke = 8, value, baseline, tone = "accent", dashed, knob, inner, icon, children,
}: Props) {
  const color = useTokenColor(tone === "muted" ? "muted" : tone);
  const track = useTokenColor("border");
  const fg = useTokenColor("foreground");

  const r = (size - stroke) / 2 - (knob ? stroke / 2 : 0);
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const arc = (circ * SWEEP) / 360;
  const at = (pct: number, radius = r) => polar(c, radius, START + (SWEEP * pct) / 100);

  const tip = value !== null ? at(value) : null;
  // The gap icon sits at the bottom; keep the disc clear of it.
  const iconSize = Math.round(size * 0.16);
  const iconBottom = Math.max(0, stroke / 2 - 2);
  const discR = Math.min(r - stroke * 1.4, icon ? size - iconBottom - iconSize - 4 - c : Infinity);
  const tickIn = baseline != null ? at(baseline, r - stroke) : null;
  const tickOut = baseline != null ? at(baseline, r + stroke) : null;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {inner && (
          <>
            <Defs>
              <RadialGradient id="disc" cx="50%" cy="42%" r="60%">
                <Stop offset="0" stopColor={color} stopOpacity={0.26} />
                <Stop offset="1" stopColor={color} stopOpacity={0.07} />
              </RadialGradient>
              <Pattern id="dots" width={9} height={9} patternUnits="userSpaceOnUse">
                <Circle cx={4.5} cy={4.5} r={0.8} fill={fg} fillOpacity={0.09} />
              </Pattern>
            </Defs>
            <Circle cx={c} cy={c} r={discR} fill="url(#disc)" stroke={color} strokeOpacity={0.18} strokeWidth={1} />
            <Circle cx={c} cy={c} r={discR} fill="url(#dots)" />
          </>
        )}
        <Circle
          cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={dashed ? `2 ${stroke + 2}` : `${arc} ${circ}`}
          transform={`rotate(${START} ${c} ${c})`}
          opacity={dashed ? 1 : 0.7}
        />
        {value !== null && (
          <Circle
            cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(arc * value) / 100} ${circ}`}
            transform={`rotate(${START} ${c} ${c})`}
          />
        )}
        {tickIn && tickOut && (
          <Line x1={tickIn.x} y1={tickIn.y} x2={tickOut.x} y2={tickOut.y} stroke={fg} strokeWidth={2} opacity={0.55} strokeLinecap="round" />
        )}
        {knob && tip && <Circle cx={tip.x} cy={tip.y} r={stroke * 0.95} fill={color} stroke={fg} strokeOpacity={0.15} strokeWidth={1} />}
      </Svg>
      {children}
      {icon && (
        <View style={{ position: "absolute", bottom: iconBottom }}>
          <SymbolView name={icon} size={iconSize} tintColor={dashed ? track : color} />
        </View>
      )}
    </View>
  );
}

function polar(c: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: c + r * Math.cos(rad), y: c + r * Math.sin(rad) };
}
