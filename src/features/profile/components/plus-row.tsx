import { View } from "react-native";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { PLUS_TIER_ICON } from "@/src/features/settings/components/settings-icons";
import { usePaywall } from "@/src/features/purchases/use-paywall";
import { playSoftPress } from "@/src/lib/haptics";

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

type Props = {
  staggerDelay?: number;
};

/**
 * A door, not an offer (#221 §5): always here, user-initiated, and exempt from
 * every proactive-offer cooldown — the same treatment the settings row gets.
 * Deliberately not the shared PlusOfferCard: there's nothing to decline.
 */
export function PlusRow({ staggerDelay = 500 }: Props) {
  const accentColor = useThemeColor("accent") as string;
  const openPaywall = usePaywall((s) => s.open);

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280, easing: EASE, delay: staggerDelay }}
      className="mx-5 mt-4"
    >
      <PressableFeedback
        onPress={() => {
          playSoftPress();
          openPaywall("profile_row");
        }}
        accessibilityRole="button"
        accessibilityLabel="Xolace+. The nights add up. See what that gets you."
        className="flex-row items-center gap-3 rounded-3xl border border-accent/25 bg-accent/[0.05] px-5 py-4"
      >
        <View className="size-9 items-center justify-center rounded-xl bg-accent/12">
          <SymbolView name={PLUS_TIER_ICON} size={16} tintColor={accentColor} />
        </View>
        <View className="flex-1">
          <AppText className="text-[15px] font-medium text-foreground">Xolace+</AppText>
          <AppText className="text-[13px] leading-5 text-muted">
            The nights add up. See what that gets you.
          </AppText>
        </View>
      </PressableFeedback>
    </EaseView>
  );
}
