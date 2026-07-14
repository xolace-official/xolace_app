import { useState } from "react";
import { SymbolView } from "expo-symbols";
import { PressableFeedback, Spinner, useThemeColor } from "heroui-native";
import { usePostHog } from "posthog-react-native";
import { AppText } from "@/src/components/shared/app-text";
import { useRevenueCat } from "@/src/features/purchases/revenuecat-context";
import { usePaywall, type PaywallSurface } from "@/src/features/purchases/use-paywall";

const CLOSE_ICON_NAME = { ios: "xmark", android: "close", web: "close" } as const;

type CloseProps = {
  surface?: PaywallSurface;
};

export function PaywallCloseButton({ surface }: CloseProps) {
  const posthog = usePostHog();
  const closePaywall = usePaywall((s) => s.close);
  const tintColor = useThemeColor("muted") as string;

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={12}
      onPress={() => {
        posthog.capture("paywall_dismissed", { surface: surface ?? null });
        closePaywall();
      }}
    >
      <SymbolView name={CLOSE_ICON_NAME} size={16} tintColor={tintColor} />
    </PressableFeedback>
  );
}

export function PaywallRestoreButton() {
  const { restorePurchases } = useRevenueCat();
  const tintColor = useThemeColor("muted") as string;
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = () => {
    setIsRestoring(true);
    restorePurchases().finally(() => setIsRestoring(false));
  };

  // Android's native header sizes this view to the label's measured width with
  // no slack, which truncates the trailing glyph ("Restor"). The fixed width
  // plus the label's own padding keeps the text box wider than the glyphs, and
  // swapping to a spinner rather than a longer label keeps the width constant
  // across states so the header never re-measures.
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel="Restore purchases"
      isDisabled={isRestoring}
      hitSlop={12}
      onPress={handleRestore}
      className="w-24 flex-row items-center justify-end pr-1"
    >
      {isRestoring ? (
        <Spinner size="sm" color={tintColor} />
      ) : (
        <AppText numberOfLines={1} className="text-[13px] text-muted pr-1">
          Restore
        </AppText>
      )}
    </PressableFeedback>
  );
}
