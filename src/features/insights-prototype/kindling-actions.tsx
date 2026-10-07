// PROTOTYPE (#491) — stubbed hand-off from a compounding domain to Kindling.
// Real routing is the Support routing map (#497); these do nothing.
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { CAVEAT, type Icon } from "./mock";

const ACTIONS: { label: string; icon: Icon }[] = [
  { label: "Sit with this", icon: { ios: "flame", android: "local_fire_department", web: "local_fire_department" } as Icon },
  { label: "Read: when work won't switch off", icon: { ios: "book", android: "menu_book", web: "menu_book" } as Icon },
  { label: "Someone who's been here", icon: { ios: "person.2", android: "group", web: "group" } as Icon },
];

export function KindlingActions({ compact }: { compact?: boolean }) {
  const ember = useTokenColor("ember");
  const list = compact ? ACTIONS.slice(0, 2) : ACTIONS;
  return (
    <View className="gap-2">
      {list.map((a) => (
        <Pressable
          key={a.label}
          onPress={() => console.log("[prototype] kindling:", a.label)}
          className="flex-row items-center gap-3 rounded-2xl bg-surface-secondary px-4 py-3 active:opacity-70"
        >
          <SymbolView name={a.icon} size={16} tintColor={ember} />
          <AppText className="flex-1 text-[14px]">{a.label}</AppText>
          <AppText className="text-muted">›</AppText>
        </Pressable>
      ))}
    </View>
  );
}

export function Caveat() {
  return (
    <AppText className="text-[12px] text-muted leading-5 text-center px-8">
      {CAVEAT}
    </AppText>
  );
}
