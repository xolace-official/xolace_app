// PROTOTYPE (#491) — Variant C "What's building": no hero ring. Leads with the
// compounding domain and its hand-off; every area is a quiet row below.
import { View } from "react-native";
import { Chip } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { SteadinessRing } from "./steadiness-ring";
import { TrendChip } from "./trend-chip";
import { Caveat, KindlingActions } from "./kindling-actions";
import { freeWord, overallFor, ranked, stateWord, type Domain, type Tier } from "./mock";

export const name = "What's building";

export function VariantC({ domains, tier }: { domains: Domain[]; tier: Tier }) {
  const plus = tier === "plus";
  const list = ranked(domains);
  const lead = list.find((d) => d.compounding === "compounding");
  const shown = list.filter((d) => d.stage !== "warming");
  const warming = list.filter((d) => d.stage === "warming");
  const overall = overallFor(domains);

  return (
    <View className="px-5 gap-6">
      <Caveat />

      {lead && (
        <View className="rounded-3xl bg-surface border border-ember/50 p-5 gap-4">
          <AppText className="text-[10px] text-ember tracking-widest uppercase">building lately</AppText>
          <AppText className="text-[22px] font-medium leading-8">{lead.label}</AppText>
          {plus ? (
            <>
              <View className="flex-row items-center gap-2">
                <AppText className="text-[14px] text-muted">{lead.score} now · usually {lead.baseline}</AppText>
                {lead.weekDelta !== null && <TrendChip delta={lead.weekDelta} />}
              </View>
              <AppText className="text-[15px] leading-6 text-foreground/90">{lead.insight}</AppText>
              <KindlingActions />
            </>
          ) : (
            <AppText className="text-[14px] text-foreground/75 leading-6">
              Something's been building here. See the pattern, and what helped before, with Xolace+.
            </AppText>
          )}
        </View>
      )}

      <View className="rounded-3xl bg-surface border border-border/65 px-4 py-2">
        {overall && (
          <Row label="Overall" sub={overall.score >= overall.baseline ? "Steady" : "A little heavier"} value={overall.score} delta={overall.weekDelta} />
        )}
        {shown.map((d) => (
          <Row
            key={d.key}
            d={d}
            label={d.label}
            sub={d.lastSeen ? `Not recently · last seen ${d.lastSeen}` : plus ? stateWord(d) : freeWord(d)}
            value={plus ? d.score : null}
            delta={plus ? d.weekDelta : null}
            plus={plus}
          />
        ))}
      </View>

      {warming.length > 0 && (
        <View className="gap-2">
          <AppText className="text-[12px] text-muted">Still getting to know</AppText>
          <View className="flex-row flex-wrap gap-2">
            {warming.map((d) => (
              <Chip key={d.key} size="sm" variant="tertiary" color="default">
                <Chip.Label>{d.label}</Chip.Label>
              </Chip>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

type RowProps = { d?: Domain; label: string; sub: string; value: number | null; delta: number | null; plus?: boolean };

function Row({ d, label, sub, value, delta, plus }: RowProps) {
  const tone = plus && d && d.compounding !== "none" ? "ember" : d?.lastSeen ? "muted" : "accent";
  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-border/40 last:border-b-0">
      <SteadinessRing size={44} stroke={4} value={value} tone={tone} icon={d?.icon} />
      <View className="flex-1">
        <AppText className="text-[15px]">{label}</AppText>
        <AppText className="text-[12px] text-muted">{sub}</AppText>
      </View>
      {value !== null && <AppText className="text-[20px] font-bold">{value}</AppText>}
      {delta !== null && <TrendChip delta={delta} suffix="" />}
    </View>
  );
}
