// PROTOTYPE (#491) — list view of "Parts of your life": one row per area with a
// flat tick meter (from clarity-main metrics/tick-bar), plus the grid/list toggle.
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Presets } from "react-native-pulsar";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { TrendChip } from "./trend-chip";
import { freeWord, stateWord, type Domain, type Icon } from "./mock";

export type DomainView = "grid" | "list";

const GRID = { ios: "circle.grid.2x2", android: "grid_view", web: "grid_view" } as Icon;
const LIST = { ios: "list.bullet", android: "view_list", web: "view_list" } as Icon;

export function ViewToggle({ value, onChange }: { value: DomainView; onChange: (v: DomainView) => void }) {
  const [accentFg, muted] = [useTokenColor("accent-foreground"), useTokenColor("muted")];
  return (
    <View className="flex-row rounded-full bg-surface-secondary p-1">
      {(["grid", "list"] as const).map((v) => (
        <Pressable key={v} onPress={() => {
            if (v === value) return;
            Presets.System.selection(); // native segmented-control tick
            onChange(v);
          }} hitSlop={4}
          className={`rounded-full px-3 py-1.5 ${value === v ? "bg-accent" : ""}`}>
          <SymbolView name={v === "grid" ? GRID : LIST} size={15} tintColor={value === v ? accentFg : muted} />
        </Pressable>
      ))}
    </View>
  );
}

type RowProps = { d: Domain; plus: boolean; selected: boolean; onPress: () => void };

export function DomainRow({ d, plus, selected, onPress }: RowProps) {
  const tone = plus && d.compounding !== "none" ? "ember" : d.lastSeen ? "muted" : "accent";
  const ink = useTokenColor(tone);
  const muted = useTokenColor("muted");
  const warming = d.stage === "warming";
  const sub = d.lastSeen ? `Not recently · last seen ${d.lastSeen}` : warming ? "Warming up" : plus ? stateWord(d) : freeWord(d);
  return (
    <Pressable onPress={onPress} className={`gap-3 rounded-2xl px-3 py-3 ${selected ? "bg-surface-secondary" : ""}`}>
      <View className="flex-row items-center gap-3">
        <View className="size-10 rounded-xl bg-surface-secondary items-center justify-center">
          <SymbolView name={d.icon} size={17} tintColor={warming ? muted : ink} />
        </View>
        <View className="flex-1">
          <AppText className="text-[15px]">{d.label}</AppText>
          <AppText className="text-[12px] text-muted">{sub}</AppText>
        </View>
        {plus && d.score !== null && <AppText className="text-[20px] font-bold">{d.score}</AppText>}
        {plus && d.weekDelta !== null && <TrendChip delta={d.weekDelta} suffix="" />}
      </View>
      {!warming && <TickBar fill={plus ? (d.score ?? 0) / 100 : 0} mark={plus ? d.baseline : null} ink={ink} />}
    </Pressable>
  );
}

/** Rounded bars spread across the width; the first `fill` share inked, the
 * person's usual drawn taller in --foreground. */
function TickBar({ fill, mark, ink }: { fill: number; mark: number | null; ink: string }) {
  const [track, fg] = [useTokenColor("border"), useTokenColor("foreground")];
  const n = 36;
  const inked = Math.round(fill * n);
  const markAt = mark != null ? Math.round((mark / 100) * (n - 1)) : -1;
  return (
    <View className="flex-row items-center justify-between" style={{ height: 22 }}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{
          width: 4, height: i === markAt ? 22 : 14, borderRadius: 2,
          backgroundColor: i === markAt ? fg : i < inked ? ink : track,
        }} />
      ))}
    </View>
  );
}
