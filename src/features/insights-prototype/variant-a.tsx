// PROTOTYPE (#491) — Variant A "Ring grid": overall hero ring, 3-up grid of
// domain rings (icon in the gap), tap a ring for its detail + Kindling hand-off.
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Chip } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { AppText } from "@/src/components/shared/app-text";
import { SteadinessRing } from "./steadiness-ring";
import { TrendChip } from "./trend-chip";
import { Caveat, KindlingActions } from "./kindling-actions";
import { freeWord, overallFor, ranked, stateWord, type Domain, type Icon, type Tier } from "./mock";

const OVERALL_ICON = { ios: "gauge.with.needle", android: "speed", web: "speed" } as Icon;
const LOCK_ICON = { ios: "lock", android: "lock", web: "lock" } as Icon;

export const name = "Ring grid";

export function VariantA({ domains, tier }: { domains: Domain[]; tier: Tier }) {
  const list = ranked(domains);
  const [selKey, setSelKey] = useState(list[0]?.key);
  const sel = list.find((d) => d.key === selKey) ?? list[0];
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

      <View className="px-5 gap-3">
        <View className="flex-row items-center justify-between">
          <AppText className="text-[20px] font-medium">Parts of your life</AppText>
          {!plus && (
            <Chip size="md" variant="secondary" color="default" onPress={() => console.log("[prototype] paywall: domain_numbers")}>
              <SymbolView name={LOCK_ICON} size={13} tintColor={accent} />
              <Chip.Label>Unlock numbers</Chip.Label>
            </Chip>
          )}
        </View>
        <View className="rounded-3xl bg-surface border border-border/65 p-4">
          <View className="flex-row flex-wrap justify-between gap-y-5">
            {list.map((d) => (
              <Cell key={d.key} d={d} plus={plus} selected={d.key === sel?.key} onPress={() => setSelKey(d.key)} />
            ))}
          </View>
        </View>
      </View>

      {sel && sel.stage !== "warming" && (
        <View className="px-5">
          <Detail d={sel} plus={plus} />
        </View>
      )}

      <Caveat />
    </View>
  );
}

function Cell({ d, plus, selected, onPress }: { d: Domain; plus: boolean; selected: boolean; onPress: () => void }) {
  const warming = d.stage === "warming";
  const tone = plus && d.compounding !== "none" ? "ember" : d.lastSeen ? "muted" : "accent";
  return (
    <Pressable onPress={onPress} className={`w-[31%] items-center gap-1 rounded-2xl py-2 ${selected ? "bg-surface-secondary" : ""}`}>
      <SteadinessRing size={86} stroke={7} value={plus ? d.score : null} dashed={warming} tone={tone} icon={d.icon}>
        {plus && d.score !== null ? (
          <>
            <AppText className="text-[22px] font-bold leading-7">{d.score}</AppText>
            <AppText className="text-[9px] text-muted -mt-0.5">/100</AppText>
          </>
        ) : (
          <AppText className="text-[10px] text-muted text-center px-3">{warming ? "warming" : freeWord(d)}</AppText>
        )}
      </SteadinessRing>
      <AppText numberOfLines={1} className="text-[11px] text-foreground/85">{d.label}</AppText>
      {d.lastSeen && <AppText className="text-[9px] text-muted">last seen {d.lastSeen}</AppText>}
    </Pressable>
  );
}

function Detail({ d, plus }: { d: Domain; plus: boolean }) {
  if (!plus) {
    return (
      <View className="rounded-3xl bg-surface border border-border/65 p-5 gap-2">
        <AppText className="text-[17px] font-medium">{d.label}</AppText>
        <AppText className="text-[14px] text-foreground/75 leading-6">
          {d.compounding === "compounding"
            ? `Something's been building in ${d.label}. See the pattern with Xolace+.`
            : `${freeWord(d)}. The number, your usual, and what's moving it are with Xolace+.`}
        </AppText>
      </View>
    );
  }
  return (
    <View className="rounded-3xl bg-surface border border-border/65 p-5 gap-4">
      <View className="flex-row items-center justify-between">
        <View>
          <AppText className="text-[17px] font-medium">{d.label}</AppText>
          <AppText className="text-[13px] text-muted mt-0.5">
            {stateWord(d)}
            {d.baseline !== null ? ` · usually ${d.baseline}` : ""}
          </AppText>
        </View>
        {d.weekDelta !== null && <TrendChip delta={d.weekDelta} />}
      </View>
      {d.insight && <AppText className="text-[15px] leading-6 text-foreground/90">{d.insight}</AppText>}
      {d.compounding !== "none" && <KindlingActions compact />}
    </View>
  );
}
