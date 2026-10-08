// Xolace+ detail for the selected domain (#491): a half tick-gauge whose ring
// centre sits on the card's top edge, so the card's rounded clip cuts the top
// arc (from clarity-main daily-goal-card). The taller tick is the person's usual.
// Insight text and the Kindling hand-off arrive with compounding (#520).
import { useEffect } from "react";
import { View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { GlassSurface, TickGauge, gaugeSize } from "./glass";
import { DOMAIN_META, STAGE_WORD, lastSeen, type DomainItem } from "./domains";
import { TrendChip } from "./trend-chip";

const RADIUS = 120;
const TICK = 30;
const TICK_WIDTH = 9;
const CENTER_Y = 18; // ring centre, measured from the card's top edge
const WINDOW = 150;

export function DetailCard({ d, value }: { d: DomainItem; value: number }) {
  const baseline = d.baseline ?? null;
  const sub = d.lastSeenAt !== null ? `Not recently · last seen ${lastSeen(d.lastSeenAt)}` : STAGE_WORD[d.state];
  return (
    <GlassSurface radius={24} className="overflow-hidden px-5 pb-5 gap-4">
      <HalfGauge value={value} baseline={baseline} tone={d.lastSeenAt !== null ? "muted" : "accent"} />
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <AppText className="text-[17px] font-medium">{DOMAIN_META[d.domain].label}</AppText>
          <AppText className="text-[13px] text-muted mt-0.5">
            {sub}
            {baseline !== null ? ` · usually ${baseline}` : ""}
          </AppText>
        </View>
        {d.trend != null && <TrendChip delta={d.trend} />}
      </View>
    </GlassSurface>
  );
}

function HalfGauge({ value, baseline, tone }: { value: number; baseline: number | null; tone: "accent" | "muted" }) {
  const fill = useTokenColor(tone);
  const track = useTokenColor("border");
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(value / 100, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value, progress]);

  const size = gaugeSize(RADIUS, TICK_WIDTH, TICK, baseline !== null);
  return (
    <View
      style={{ height: WINDOW }}
      accessible accessibilityLabel={`${value} out of 100${baseline !== null ? `, usually ${baseline}` : ""}`}
    >
      <View className="absolute self-center" style={{ top: CENTER_Y - size / 2 }}>
        <TickGauge
          ticks={17} startAngle={180} sweep={-180} radius={RADIUS} tickLength={TICK} tickWidth={TICK_WIDTH}
          progress={progress} fill={fill} track={track} mark={baseline !== null ? baseline / 100 : null}
        />
      </View>
      <View className="absolute inset-x-0 items-center" style={{ top: CENTER_Y + 4 }}>
        <AppText className="text-[13px] text-muted">now</AppText>
        <AppText className="text-[40px] leading-[46px] font-bold tracking-tight">{value}</AppText>
      </View>
    </View>
  );
}
