// PROTOTYPE (#491) — Variant A "Ring grid": overall hero ring, 3-up grid of
// domain rings (icon in the gap), tap a ring for its detail + Kindling hand-off.
import { View } from "react-native";
import { Chip } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { AppText } from "@/src/components/shared/app-text";
import { SteadinessRing } from "./steadiness-ring";
import { DomainSection } from "./domain-grid";
import { TrendChip } from "./trend-chip";
import { Caveat } from "./kindling-actions";
import { overallFor, type Domain, type Icon, type Tier } from "./mock";

const OVERALL_ICON = { ios: "gauge.with.needle", android: "speed", web: "speed" } as Icon;

export const name = "Ring grid";

export function VariantA({ domains, tier }: { domains: Domain[]; tier: Tier }) {
  const overall = overallFor(domains);
  const plus = tier === "plus";
  const accent = useTokenColor("accent");

  return (
    <View className="gap-8">
      <View className="items-center gap-3">
        {overall ? (
          <>
            <SteadinessRing size={250} stroke={8} knob inner value={overall.score} baseline={plus ? overall.baseline : null}>
              <View className="flex-row items-center gap-1.5">
                <SymbolView name={OVERALL_ICON} size={14} tintColor={accent} />
                <AppText className="text-[14px] text-accent">overall</AppText>
              </View>
              <AppText className="text-[72px] leading-[80px] font-bold tracking-tight">{overall.score}</AppText>
              <Chip size="sm" variant="secondary" color="default" className="self-center">
                <Chip.Label>{overall.score >= overall.baseline ? "Steady" : "A little heavier"}</Chip.Label>
              </Chip>
            </SteadinessRing>
            <TrendChip delta={overall.weekDelta} size="md" />
          </>
        ) : (
          <AppText className="text-[15px] text-foreground/75 text-center px-10 leading-6">
            Your overall ring lights up once Xolace knows two parts of your life.
          </AppText>
        )}
      </View>

      <DomainSection domains={domains} plus={plus} />

      <Caveat />
    </View>
  );
}
