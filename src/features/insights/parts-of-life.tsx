// Every touched domain, as a ring grid or tick-meter list on glass (#491).
// Free users get unfilled rings and the "Unlock numbers" pill (#513).
import { useState } from "react";
import { View } from "react-native";
import { Chip } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { usePaywall } from "@/src/features/purchases/use-paywall";
import { GlassSurface } from "./glass";
import { DomainCell, DomainRow, ViewToggle, type DomainView } from "./domain-list";
import { icon, type DomainItem } from "./domains";

const LOCK = icon("lock", "lock");

export function PartsOfLife({ domains, isPlus }: { domains: DomainItem[]; isPlus: boolean }) {
  const [view, setView] = useState<DomainView>("grid");
  const accent = useTokenColor("accent");
  const openPaywall = usePaywall((s) => s.open);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText className="text-[20px] font-medium">Parts of your life</AppText>
        <ViewToggle value={view} onChange={setView} />
      </View>
      {!isPlus && (
        <Chip
          size="md" variant="secondary" color="default"
          onPress={() => openPaywall("steadiness_numbers")}
          accessibilityRole="button"
        >
          <SymbolView name={LOCK} size={13} tintColor={accent} />
          <Chip.Label>Unlock numbers</Chip.Label>
        </Chip>
      )}
      <GlassSurface radius={24} className={view === "grid" ? "p-4" : "p-2"}>
        {view === "grid" ? (
          <View className="flex-row flex-wrap justify-between gap-y-5">
            {domains.map((d) => <DomainCell key={d.domain} d={d} />)}
            {/* Keep a short last row left-aligned under justify-between. */}
            {domains.length % 3 === 2 && <View className="w-[31%]" />}
          </View>
        ) : (
          domains.map((d) => <DomainRow key={d.domain} d={d} />)
        )}
      </GlassSurface>
    </View>
  );
}
