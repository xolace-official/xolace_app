// PROTOTYPE (#491) — Variant F "Glass ticks": the overall dial as a fan of
// ticks that fill in on mount, on a liquid-glass card (from clarity-main).
import { useEffect } from "react";
import { View } from "react-native";
import { Chip } from "heroui-native";
import { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { Presets } from "react-native-pulsar";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { DomainSection } from "./domain-grid";
import { GlassSurface, TickGauge } from "./glass";
import { TrendChip } from "./trend-chip";
import { Caveat } from "./kindling-actions";
import { overallFor, type Domain, type Icon, type Tier } from "./mock";

const OVERALL_ICON = { ios: "gauge.with.needle", android: "speed", web: "speed" } as Icon;

export const name = "Glass ticks";

export function VariantF({ domains, tier }: { domains: Domain[]; tier: Tier }) {
  const plus = tier === "plus";
  const overall = overallFor(domains);
  const accent = useTokenColor("accent");
  const track = useTokenColor("border");
  const progress = useSharedValue(0);

  useEffect(() => {
    // A rising swell as the ticks fill: the number arriving, not a reward.
    // ponytail: not in _layout's preload list, so the first play may lag; add 'Swell' there if kept.
    if (overall?.score !== undefined) Presets.swell();
    progress.set(withTiming((overall?.score ?? 0) / 100, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [overall?.score, progress]);

  return (
    <View className="gap-8">
      <View className="px-5">
        <GlassSurface style={{ paddingVertical: 24, alignItems: "center", gap: 12 }}>
          {overall ? (
            <>
              <TickGauge ticks={56} startAngle={135} sweep={270} radius={118} tickLength={20} tickWidth={4} progress={progress} fill={accent} track={track}>
                <View className="flex-row items-center gap-1.5">
                  <SymbolView name={OVERALL_ICON} size={14} tintColor={accent} />
                  <AppText className="text-[14px] text-accent">overall</AppText>
                </View>
                <AppText className="text-[68px] leading-[76px] font-bold tracking-tight">{overall.score}</AppText>
                <AppText className="text-[12px] text-muted -mt-1">/100</AppText>
              </TickGauge>
              <View className="flex-row gap-2 -mt-6">
                <Chip size="md" variant="secondary" color="default">
                  <Chip.Label>{overall.score >= overall.baseline ? "Steady" : "A little heavier"}</Chip.Label>
                </Chip>
                <TrendChip delta={overall.weekDelta} size="md" />
              </View>
              {plus && <AppText className="text-[12px] text-muted">Your usual: {overall.baseline}</AppText>}
            </>
          ) : (
            <AppText className="text-[15px] text-foreground/75 text-center px-8 leading-6">
              Your overall dial lights up once Xolace knows two parts of your life.
            </AppText>
          )}
        </GlassSurface>
      </View>

      <DomainSection domains={domains} plus={plus} glass />
      <Caveat />
    </View>
  );
}
