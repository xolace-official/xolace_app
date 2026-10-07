// PROTOTYPE (#491) — Variant E "Big arc": a huge soft circle bleeding off the
// top (ref: cycle tracker), a row of area icons like a week strip, and an
// editorial number. No ring on the hero — the arc is the backdrop.
import { useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { SymbolView } from "expo-symbols";
import { Presets } from "react-native-pulsar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { Detail } from "./domain-grid";
import { TrendChip } from "./trend-chip";
import { Caveat } from "./kindling-actions";
import { freeWord, overallFor, ranked, stateWord, type Domain, type Tier } from "./mock";

export const name = "Big arc";

export function VariantE({ domains, tier }: { domains: Domain[]; tier: Tier }) {
  const plus = tier === "plus";
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = ranked(domains);
  const overall = overallFor(domains);
  const [selKey, setSelKey] = useState<string | null>(null);
  const sel = list.find((d) => d.key === selKey);
  const [accent, ember, fg, muted] = [useTokenColor("accent"), useTokenColor("ember"), useTokenColor("foreground"), useTokenColor("muted")];

  const big = width * 1.7;
  const small = width * 0.95;
  const number = sel ? (plus ? sel.score : null) : (overall?.score ?? null);
  const words = sel
    ? plus ? stateWord(sel) : freeWord(sel)
    : overall ? (overall.score >= overall.baseline ? "steady, close to your usual" : "a little heavier than your usual") : "lights up once Xolace knows two parts of your life";

  return (
    <View className="gap-8" style={{ marginTop: -(insets.top + 64) }}>
      <View style={{ paddingTop: insets.top + 56, paddingBottom: 48 }} className="overflow-hidden">
        <View pointerEvents="none" className="absolute rounded-full bg-accent/15" style={{ width: big, height: big, left: (width - big) / 2, top: -big + 520 }} />
        <View pointerEvents="none" className="absolute rounded-full bg-surface/45" style={{ width: small, height: small, right: -small * 0.32, top: -small * 0.12 }} />

        <View className="flex-row justify-between px-4">
          {list.map((d) => {
            const on = d.key === selKey;
            const tint = d.stage === "warming" ? muted : plus && d.compounding === "compounding" ? ember : on ? accent : fg;
            return (
              <Pressable key={d.key} onPress={() => {
                Presets.flick();
                setSelKey(on ? null : d.key);
              }} className={`size-10 rounded-full items-center justify-center ${on ? "bg-surface" : ""}`}>
                <SymbolView name={d.icon} size={17} tintColor={tint} />
              </Pressable>
            );
          })}
        </View>

        <View className="items-center mt-10 gap-1 px-8">
          <AppText className="text-[15px] text-foreground/80">{sel ? sel.label : "Overall steadiness"}</AppText>
          <AppText className="text-[104px] leading-[112px] font-bold tracking-tighter">{number ?? "—"}</AppText>
          <AppText className="text-[15px] text-foreground/80 text-center">{words}</AppText>
          {(sel ? plus && sel.weekDelta !== null : overall) && (
            <View className="mt-3">
              <TrendChip delta={(sel ? sel.weekDelta : overall?.weekDelta) ?? 0} size="md" />
            </View>
          )}
          {!sel && plus && list[0]?.compounding === "compounding" && (
            <Pressable onPress={() => setSelKey(list[0].key)} className="mt-5 rounded-full bg-surface px-5 py-2.5 active:opacity-70">
              <AppText className="text-[15px] font-medium">See what's building</AppText>
            </Pressable>
          )}
        </View>
      </View>

      {sel && sel.stage !== "warming" && (
        <View className="px-5">
          <Detail d={sel} plus={plus} />
        </View>
      )}
      {!sel && <AppText className="text-[13px] text-muted text-center">Tap an icon to see one part of your life.</AppText>}
      <Caveat />
    </View>
  );
}
