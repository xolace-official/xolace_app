// PROTOTYPE — throwaway (#457). Variant A "Scatter": a tight, uneven cluster —
// one large circle in the middle, the rest packed close around it at mixed
// sizes (after the "Progress & Grow" reference). No captions; copy centred below.
import { useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import {
  Bubble, COPY, Cta, KINDS, Skip, type Kind, type VariantProps,
} from "@/src/features/kindling/announcement-prototype/proto-data";

// [centreX, centreY, radius] as fractions of the cluster width.
const LAYOUT: Record<Kind, readonly [number, number, number]> = {
  audio: [0.44, 0.15, 0.13],
  music: [0.72, 0.29, 0.114],
  breathing: [0.44, 0.467, 0.146],
  read: [0.2, 0.464, 0.066],
  xolacer: [0.72, 0.57, 0.103],
  bridge: [0.5, 0.744, 0.09],
};
const HEIGHT = 0.84;

export function ScatterVariant(props: VariantProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const box = width;
  const accent = useThemeColor("accent") as string;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 72 }}>
      <Skip onSkip={props.onSkip} />
      <View style={{ width: box, height: box * HEIGHT }}>
        {/* Soft glow behind the cluster. */}
        <Svg width={box} height={box * HEIGHT} style={{ position: "absolute" }}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={accent} stopOpacity={0.28} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={box * 0.47} cy={box * 0.45} r={box * 0.48} fill="url(#glow)" />
        </Svg>
        {KINDS.map((kind) => {
          const [cx, cy, r] = LAYOUT[kind];
          return (
            <View key={kind} className="absolute" style={{ left: (cx - r) * box, top: (cy - r) * box }}>
              <Bubble kind={kind} size={2 * r * box} />
            </View>
          );
        })}
      </View>
      <View className="mt-auto items-center gap-3 px-6">
        <AppText className="text-xs uppercase tracking-widest text-accent">{COPY.eyebrow}</AppText>
        <AppText className="text-center font-serif text-3xl leading-9 text-foreground">{COPY.title}</AppText>
        <AppText className="text-center text-base text-muted">
          {props.variant === "plus" ? COPY.body : COPY.freeBody}
        </AppText>
        <View className="mt-3 w-full">
          <Cta {...props} />
        </View>
      </View>
    </View>
  );
}
