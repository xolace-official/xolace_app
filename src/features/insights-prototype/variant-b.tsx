// PROTOTYPE (#491) — Variant B "One dial": a single large dial (ref: "vitality 75
// Balanced") that you point at overall or one domain via a chip rail.
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Chip } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { SteadinessRing } from "./steadiness-ring";
import { TrendChip } from "./trend-chip";
import { Caveat, KindlingActions } from "./kindling-actions";
import { freeWord, overallFor, ranked, stateWord, type Domain, type Tier } from "./mock";

export const name = "One dial";

export function VariantB({ domains, tier }: { domains: Domain[]; tier: Tier }) {
  const plus = tier === "plus";
  const list = ranked(domains);
  const overall = overallFor(domains);
  const [selKey, setSelKey] = useState<string>(overall ? "overall" : list[0]?.key);
  const sel = list.find((d) => d.key === selKey);
  const ember = useTokenColor("ember");
  const muted = useTokenColor("muted");

  // What the dial shows. Free: overall number only; domains show their stage word.
  const showNumber = sel ? plus && sel.score !== null : !!overall;
  const value = sel ? (showNumber ? sel.score : null) : (overall?.score ?? null);
  const word = sel ? (plus ? stateWord(sel) : freeWord(sel)) : overall && overall.score >= overall.baseline ? "Steady" : "A little heavier";
  const delta = sel ? (plus ? sel.weekDelta : null) : (overall?.weekDelta ?? null);

  return (
    <View className="gap-6">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-2">
        {overall && (
          <Chip size="md" variant={selKey === "overall" ? "primary" : "secondary"} color={selKey === "overall" ? "accent" : "default"} onPress={() => setSelKey("overall")}>
            <Chip.Label>Overall</Chip.Label>
          </Chip>
        )}
        {list.map((d) => {
          const on = d.key === selKey;
          return (
            <Chip key={d.key} size="md" variant={on ? "primary" : "secondary"} color={on ? "accent" : "default"} onPress={() => setSelKey(d.key)}>
              {plus && d.compounding === "compounding" && <View className="size-1.5 rounded-full" style={{ backgroundColor: ember }} />}
              <Chip.Label className={d.stage === "warming" ? "opacity-50" : ""}>{d.label}</Chip.Label>
            </Chip>
          );
        })}
      </ScrollView>

      <View className="items-center gap-4">
        <SteadinessRing
          size={270} stroke={10} knob value={value}
          dashed={sel?.stage === "warming"}
          baseline={plus ? (sel ? sel.baseline : overall?.baseline) : null}
          tone={plus && sel && sel.compounding !== "none" ? "ember" : "accent"}
        >
          <View className="flex-row items-center gap-1.5">
            {sel && <SymbolView name={sel.icon} size={14} tintColor={muted} />}
            <AppText className="text-[14px] text-muted">{sel ? sel.label : "overall"}</AppText>
          </View>
          <AppText className="text-[84px] leading-[92px] font-bold tracking-tight">
            {value ?? "—"}
          </AppText>
          <Chip size="md" variant="secondary" color="default" className="self-center">
            <Chip.Label>{word}</Chip.Label>
          </Chip>
        </SteadinessRing>
        {delta !== null && <TrendChip delta={delta} size="md" />}
        {plus && sel?.baseline != null && (
          <AppText className="text-[12px] text-muted">The tick is your usual: {sel.baseline}</AppText>
        )}
      </View>

      <View className="px-5 gap-4">
        {sel && <Below d={sel} plus={plus} />}
        {!sel && (
          <AppText className="text-[14px] text-foreground/75 leading-6 text-center px-4">
            The middle of the parts of your life Xolace knows. Pick one above to see it alone.
          </AppText>
        )}
      </View>
      <Caveat />
    </View>
  );
}

function Below({ d, plus }: { d: Domain; plus: boolean }) {
  if (d.stage === "warming")
    return <AppText className="text-[14px] text-foreground/75 leading-6 text-center">Xolace is still getting to know this part of your life.</AppText>;
  if (!plus)
    return (
      <AppText className="text-[14px] text-foreground/75 leading-6 text-center">
        {d.compounding === "compounding" ? `Something's been building in ${d.label}. ` : ""}Its number and what's moving it are with Xolace+.
      </AppText>
    );
  return (
    <>
      {d.lastSeen && <AppText className="text-[13px] text-muted text-center">Not recently — last seen {d.lastSeen}</AppText>}
      {d.insight && <AppText className="text-[16px] leading-7 text-foreground/90">{d.insight}</AppText>}
      {d.compounding !== "none" && <KindlingActions />}
    </>
  );
}
