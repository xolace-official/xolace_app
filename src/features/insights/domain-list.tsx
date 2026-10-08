// "Parts of your life" pieces: grid cell, list row with a flat tick meter
// (from clarity-main metrics/tick-bar), and the grid/list toggle (#491).
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Presets } from "react-native-pulsar";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { SteadinessRing } from "./steadiness-ring";
import { DOMAIN_META, STAGE_WORD, lastSeen, type DomainItem, type Icon } from "./domains";

export type DomainView = "grid" | "list";

const GRID = { ios: "circle.grid.2x2", android: "grid_view", web: "grid_view" } as Icon;
const LIST = { ios: "list.bullet", android: "view_list", web: "view_list" } as Icon;
const TICKS = 36;

const toneOf = (d: DomainItem) => (d.lastSeenAt !== null ? "muted" : "accent");

export function ViewToggle({ value, onChange }: { value: DomainView; onChange: (v: DomainView) => void }) {
  const [accentFg, muted] = [useTokenColor("accent-foreground"), useTokenColor("muted")];
  return (
    <View className="flex-row rounded-full bg-surface-secondary p-1">
      {(["grid", "list"] as const).map((v) => (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityLabel={`Show as ${v}`}
          accessibilityState={{ selected: value === v }}
          hitSlop={4}
          onPress={() => {
            if (v === value) return;
            Presets.System.selection(); // native segmented-control tick
            onChange(v);
          }}
          className={`rounded-full px-3 py-1.5 ${value === v ? "bg-accent" : ""}`}
        >
          <SymbolView name={v === "grid" ? GRID : LIST} size={15} tintColor={value === v ? accentFg : muted} />
        </Pressable>
      ))}
    </View>
  );
}

export function DomainCell({ d }: { d: DomainItem }) {
  const { label, icon } = DOMAIN_META[d.domain];
  const warming = d.state === "warming";
  return (
    <View className="w-[31%] items-center gap-1 py-2" accessible accessibilityLabel={`${label}, ${STAGE_WORD[d.state]}`}>
      <SteadinessRing size={86} value={null} tone={toneOf(d)} dashed={warming} icon={icon}>
        <AppText className="text-[10px] text-muted text-center px-3">
          {warming ? "warming" : STAGE_WORD[d.state]}
        </AppText>
      </SteadinessRing>
      <AppText numberOfLines={1} className="text-[11px] text-foreground/85">{label}</AppText>
      {d.lastSeenAt !== null && (
        <AppText className="text-[9px] text-muted">last seen {lastSeen(d.lastSeenAt)}</AppText>
      )}
    </View>
  );
}

export function DomainRow({ d }: { d: DomainItem }) {
  const { label, icon } = DOMAIN_META[d.domain];
  const [ink, muted, track] = [useTokenColor(toneOf(d)), useTokenColor("muted"), useTokenColor("border")];
  const warming = d.state === "warming";
  const sub = d.lastSeenAt !== null ? `Not recently · last seen ${lastSeen(d.lastSeenAt)}` : STAGE_WORD[d.state];
  return (
    <View className="gap-3 px-3 py-3" accessible accessibilityLabel={`${label}, ${sub}`}>
      <View className="flex-row items-center gap-3">
        <View className="size-10 rounded-xl bg-surface-secondary items-center justify-center">
          <SymbolView name={icon} size={17} tintColor={warming ? muted : ink} />
        </View>
        <View className="flex-1">
          <AppText className="text-[15px]">{label}</AppText>
          <AppText className="text-[12px] text-muted">{sub}</AppText>
        </View>
      </View>
      {/* Unfilled in the free view: the meter's shape, never its value. */}
      {!warming && (
        <View className="flex-row items-center justify-between" style={{ height: 22 }}>
          {Array.from({ length: TICKS }, (_, i) => (
            <View key={i} style={{ width: 4, height: 14, borderRadius: 2, backgroundColor: track }} />
          ))}
        </View>
      )}
    </View>
  );
}
