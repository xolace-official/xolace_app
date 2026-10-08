// PROTOTYPE (#491) — variant A's "Parts of your life" grid + detail card,
// shared by the hero experiments (A, D, E) so only the hero differs.
import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Chip } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { Presets } from "react-native-pulsar";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { SteadinessRing } from "./steadiness-ring";
import { TrendChip } from "./trend-chip";
import { KindlingActions } from "./kindling-actions";
import { DomainRow, ViewToggle, type DomainView } from "./domain-rows";
import { HalfGauge } from "./half-gauge";
import { GlassSurface } from "./glass";
import { freeWord, ranked, stateWord, type Domain, type Icon } from "./mock";

const LOCK_ICON = { ios: "lock", android: "lock", web: "lock" } as Icon;

export function DomainSection({ domains, plus, glass }: { domains: Domain[]; plus: boolean; glass?: boolean }) {
  const list = ranked(domains);
  const [selKey, setSelKey] = useState(list[0]?.key);
  const sel = list.find((d) => d.key === selKey) ?? list[0];
  const accent = useTokenColor("accent");
  const [view, setView] = useState<DomainView>("grid");
  // Flick is the app's select cue (textureSelect, carousel advance in _layout).
  const select = (key: string) => {
    if (key !== selKey) Presets.flick();
    setSelKey(key);
  };
  return (
    <>
      <View className="px-5 gap-3">
        <View className="flex-row items-center justify-between">
          <AppText className="text-[20px] font-medium">Parts of your life</AppText>
          <ViewToggle value={view} onChange={setView} />
        </View>
        {!plus && (
          <Chip size="md" variant="secondary" color="default" onPress={() => console.log("[prototype] paywall: domain_numbers")}>
            <SymbolView name={LOCK_ICON} size={13} tintColor={accent} />
            <Chip.Label>Unlock numbers</Chip.Label>
          </Chip>
        )}
        <Card glass={glass} pad={view === "grid" ? 16 : 8} className={view === "grid" ? "p-4" : "p-2"}>
          {view === "grid" ? (
            <View className="flex-row flex-wrap justify-between gap-y-5">
              {list.map((d) => (
                <Cell key={d.key} d={d} plus={plus} inner={glass} selected={d.key === sel?.key} onPress={() => select(d.key)} />
              ))}
            </View>
          ) : (
            list.map((d) => (
              <DomainRow key={d.key} d={d} plus={plus} selected={d.key === sel?.key} onPress={() => select(d.key)} />
            ))
          )}
        </Card>
      </View>

      {sel && sel.stage !== "warming" && (
        <View className="px-5">
          <Detail d={sel} plus={plus} glass={glass} />
        </View>
      )}

    </>
  );
}

export function Cell({ d, plus, inner, selected, onPress }: { d: Domain; plus: boolean; inner?: boolean; selected: boolean; onPress: () => void }) {
  const warming = d.stage === "warming";
  const tone = plus && d.compounding !== "none" ? "ember" : d.lastSeen ? "muted" : "accent";
  return (
    <Pressable onPress={onPress} className={`w-[31%] items-center gap-1 rounded-2xl py-2 ${selected ? "bg-surface-secondary" : ""}`}>
      <SteadinessRing size={86} stroke={7} value={plus ? d.score : null} dashed={warming} tone={tone} inner={inner && !warming} icon={d.icon}>
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

export function Detail({ d, plus, glass }: { d: Domain; plus: boolean; glass?: boolean }) {
  if (!plus) {
    return (
      <Card glass={glass} pad={20} gap={8} className="p-5 gap-2">
        <AppText className="text-[17px] font-medium">{d.label}</AppText>
        <AppText className="text-[14px] text-foreground/75 leading-6">
          {d.compounding === "compounding"
            ? `Something's been building in ${d.label}. See the pattern with Xolace+.`
            : `${freeWord(d)}. The number, your usual, and what's moving it are with Xolace+.`}
        </AppText>
      </Card>
    );
  }
  return (
    <Card glass={glass} pad={20} gap={16} flushTop={d.score !== null} className={`p-5 gap-4 overflow-hidden ${d.score !== null ? "pt-0" : ""}`}>
      {d.score !== null && (
        <HalfGauge value={d.score} baseline={d.baseline} caption="now" tone={d.compounding !== "none" ? "ember" : "accent"} />
      )}
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
    </Card>
  );
}

type CardProps = { glass?: boolean; pad: number; gap?: number; flushTop?: boolean; className: string; children: ReactNode };

/** The section's card: a plain surface, or liquid glass when `glass` (variant F). */
function Card({ glass, pad, gap, flushTop, className, children }: CardProps) {
  if (glass) {
    return <GlassSurface radius={24} style={{ padding: pad, paddingTop: flushTop ? 0 : pad, gap }}>{children}</GlassSurface>;
  }
  return <View className={`rounded-3xl bg-surface border border-border/65 ${className}`}>{children}</View>;
}
