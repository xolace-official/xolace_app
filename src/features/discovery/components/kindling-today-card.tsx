import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { PressableFeedback } from "heroui-native";

import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { playSoftPress } from "@/src/lib/haptics";

const ART_URL = __DEV__
  ? "https://groovy-mandrill-892.eu-west-1.convex.cloud/api/storage/ecc29516-333a-42b0-9ee6-e1dbffd80bd9"
  : "https://energetic-guineapig-283.convex.cloud/api/storage/ffeee9b5-769c-48b2-8f25-c6c5f036352c";

// rounded-3xl, as px — the art window has to match the card's own radius.
const CARD_RADIUS = 24;

const styles = StyleSheet.create({
  card: { borderCurve: "continuous" },
  // Android only honours `overflow: 'hidden'` on a view that has a border
  // radius — without one it never sets up the clip and the art below spills
  // out past the card.
  artWindow: {
    width: 96,
    overflow: "hidden",
    borderTopRightRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
    borderCurve: "continuous",
  },
});

/**
 * Today's entry point to the active-kindling screen (docs/paths-v1.md §9.2,
 * #336). Renders nothing until `getActive` resolves a kindling — no
 * "generating" state here, since generation runs off `completeSession` and
 * the row only appears once it's written. Same reason it needs no premium
 * check of its own: `getActive` already returns `null` for a free user.
 */
export function KindlingTodayCard() {
  const router = useRouter();
  const kindling = useQuery(api.paths.getActive, { withRead: true });

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
      <View
        className="flex-row items-center overflow-hidden rounded-3xl border border-border/65 bg-surface"
        style={styles.card}
      >
        <View className="flex-1 py-6 pl-5 pr-3">
          <AppText className="text-lg font-semibold text-foreground">Your kindling</AppText>
          <AppText className="mt-1.5 text-sm leading-5 text-muted">
            {tended} of {kindling.twigs.length} tended; a few things from your last session.
          </AppText>
        </View>
        {/* Stretches to the card's height rather than carrying its own, so the
            rounded corners land on the card's corners instead of floating a
            few points inside them. */}
        <View className="self-stretch" style={styles.artWindow}>
          <Image
            source={ART_URL}
            contentFit="cover"
            style={{ flex: 1 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </View>
    </PressableFeedback>
  );
}
