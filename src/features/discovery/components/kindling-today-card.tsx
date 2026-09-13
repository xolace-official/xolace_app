import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { SymbolView } from "expo-symbols";
import { PressableFeedback, useThemeColor } from "heroui-native";

import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { playSoftPress } from "@/src/lib/haptics";

/**
 * Today's entry point to the active-kindling screen (docs/paths-v1.md §9.2,
 * #336). Renders nothing until `getActive` resolves a kindling — no
 * "generating" state here, since generation runs off `completeSession` and
 * the row only appears once it's written. Same reason it needs no premium
 * check of its own: `getActive` already returns `null` for a free user.
 */
export function KindlingTodayCard() {
  const router = useRouter();
  const accent = useThemeColor("accent") as string;
  const kindling = useQuery(api.paths.getActive, {});

  if (!kindling) return null;

  const tended = kindling.twigs.filter((t) => t.state === "done").length;

  const goToKindling = () => {
    playSoftPress();
    router.push("/(protected)/kindling");
  };

  return (
    <PressableFeedback
      onPress={goToKindling}
      accessibilityRole="button"
      accessibilityLabel="Open your kindling"
    >
      <View className="flex-row items-center gap-4 overflow-hidden rounded-3xl border border-border/65 bg-surface px-5 py-6">
        <SymbolView name={{ ios: "leaf", android: "eco", web: "eco" }} size={28} tintColor={accent} />
        <View className="flex-1">
          <AppText className="text-lg font-semibold text-foreground">Your kindling</AppText>
          <AppText className="mt-1.5 text-sm leading-5 text-muted">
            {tended} of {kindling.twigs.length} tended; a few things from your last session.
          </AppText>
        </View>
      </View>
    </PressableFeedback>
  );
}
