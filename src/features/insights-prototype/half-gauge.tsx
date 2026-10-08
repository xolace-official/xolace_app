// PROTOTYPE (#491) — half tick-gauge whose ring centre sits on the card's top
// edge, so the card's rounded clip cuts the top arc (from clarity-main
// daily-goal-card). The taller dark tick is the person's usual.
import { useEffect } from "react";
import { View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { TickGauge } from "./glass";

const RADIUS = 120;
const TICK = 30;
const CENTER_Y = 18; // ring centre, measured from the card's top edge
const WINDOW = 150;

type Props = { value: number; baseline: number | null; caption: string; tone: "accent" | "ember" };

export function HalfGauge({ value, baseline, caption, tone }: Props) {
  const fill = useTokenColor(tone);
  const track = useTokenColor("border");
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(value / 100, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value, progress]);

  const size = RADIUS * 2 + 9 + TICK * 0.5;
  return (
    <View style={{ height: WINDOW }}>
      <View style={{ position: "absolute", top: CENTER_Y - size / 2, alignSelf: "center" }}>
        <TickGauge ticks={17} startAngle={180} sweep={-180} radius={RADIUS} tickLength={TICK} tickWidth={9}
          progress={progress} fill={fill} track={track} mark={baseline != null ? baseline / 100 : null} />
      </View>
      <View style={{ position: "absolute", top: CENTER_Y + 4, left: 0, right: 0 }} className="items-center">
        <AppText className="text-[13px] text-muted">{caption}</AppText>
        <AppText className="text-[40px] leading-[46px] font-bold tracking-tight">{value}</AppText>
        {baseline != null && <AppText className="text-[11px] text-muted">usually {baseline}</AppText>}
      </View>
    </View>
  );
}
