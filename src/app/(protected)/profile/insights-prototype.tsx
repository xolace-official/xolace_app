// PROTOTYPE (#491) — throwaway route. Three insights-screen variants behind
// ?variant=A–F, with ?tier=plus|free and ?scenario=rich|early. Mock data only.
import { ScrollView, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraArc } from "@/src/features/profile/components/aurora-arc";
import { domainsFor, type Scenario, type Tier } from "@/src/features/insights-prototype/mock";
import { VariantA, name as nameA } from "@/src/features/insights-prototype/variant-a";
import { VariantB, name as nameB } from "@/src/features/insights-prototype/variant-b";
import { VariantC, name as nameC } from "@/src/features/insights-prototype/variant-c";
import { VariantD, name as nameD } from "@/src/features/insights-prototype/variant-d";
import { VariantE, name as nameE } from "@/src/features/insights-prototype/variant-e";
import { VariantF, name as nameF } from "@/src/features/insights-prototype/variant-f";
import { TopBlur } from "@/src/features/insights-prototype/top-blur";
import { PrototypeSwitcher } from "@/src/features/insights-prototype/prototype-switcher";

const VARIANTS = [
  { key: "A", name: nameA, C: VariantA },
  { key: "B", name: nameB, C: VariantB },
  { key: "C", name: nameC, C: VariantC },
  { key: "D", name: nameD, C: VariantD },
  { key: "E", name: nameE, C: VariantE },
  { key: "F", name: nameF, C: VariantF },
];

export default function InsightsPrototype() {
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ variant?: string; tier?: Tier; scenario?: Scenario }>();
  const v = VARIANTS.find((x) => x.key === p.variant) ?? VARIANTS[0];
  const tier: Tier = p.tier === "free" ? "free" : "plus";
  const scenario: Scenario = p.scenario === "early" ? "early" : "rich";
  const domains = domainsFor(scenario);

  return (
    <View className="flex-1 bg-background">
      <AuroraArc height={insets.top + 280} />
      <Stack.Screen options={{ headerShown: true, headerTransparent: true, headerTitle: "Steadiness", headerBackButtonDisplayMode: "minimal" }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: insets.bottom + 110 }}>
        {/* key resets per-variant selection state when tier/scenario flips */}
        <v.C key={`${v.key}-${tier}-${scenario}`} domains={domains} tier={tier} />
      </ScrollView>
      <TopBlur height={insets.top + 70} />
      <PrototypeSwitcher variants={VARIANTS} current={v.key} tier={tier} scenario={scenario} bottom={insets.bottom + 16} />
    </View>
  );
}
