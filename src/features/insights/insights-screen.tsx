// The insights screen (#517): variant F, "Glass ticks" (#491), free view.
// Per-domain numbers, "your usual" and trend arrive for Xolace+ in #518.
import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { AuroraArc } from "@/src/features/profile/components/aurora-arc";
import { usePlusEntitlement } from "@/src/features/purchases/use-plus-entitlement";
import { OverallDial } from "./overall-dial";
import { PartsOfLife } from "./parts-of-life";
import { TopBlur } from "./top-blur";
import { CAVEAT } from "./domains";

export function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const view = useQuery(api.compounding.insights.freeView);
  const { isPlus } = usePlusEntitlement();

  return (
    <View className="flex-1 bg-background">
      {/* Something behind the glass, so it doesn't read flat (#491 port notes). */}
      <AuroraArc height={insets.top + 280} />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Steadiness",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 }}
      >
        {view && (
          <View className="gap-8 px-5">
            <OverallDial overall={view.overall} />
            {view.domains.length > 0 && <PartsOfLife domains={view.domains} isPlus={isPlus} />}
            <AppText className="text-[12px] text-muted text-center leading-5 px-4">{CAVEAT}</AppText>
          </View>
        )}
      </ScrollView>
      <TopBlur height={insets.top + 70} />
    </View>
  );
}
