// Dev-only harness for the kindling announcement (#457): mock props, no
// session or entitlement. `bun demo:kindling`; `?tier=free` for the paywall CTA.
// Renders nothing outside dev. The real mount point is #458.
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import { KindlingAnnouncementScreen } from "@/src/features/kindling/components/kindling-announcement-screen";

export default function KindlingAnnouncementDemo() {
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ tier?: string; last?: string }>();
  const tier = p.tier === "free" ? "free" : "plus";
  const log = (last: string) => router.setParams({ last });

  if (!__DEV__) return null;

  return (
    <View className="flex-1">
      <KindlingAnnouncementScreen
        variant={tier}
        onSkip={() => log("onSkip")}
        onContinue={() => log("onContinue")}
        onPaywall={() => log("onPaywall")}
      />
      <PressableFeedback
        onPress={() => router.setParams({ tier: tier === "free" ? "plus" : "free", last: "" })}
        className="absolute left-4 rounded-full bg-foreground/90 px-3 py-1.5"
        style={{ top: insets.top + 10 }}
      >
        <AppText className="text-[11px] text-background">{`DEMO · ${tier}${p.last ? ` · ${p.last}` : ""}`}</AppText>
      </PressableFeedback>
    </View>
  );
}
