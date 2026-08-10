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

  // The width slack is Android-only. Android's native header sizes this view to
  // the label's measured width with no slack, which truncates the trailing glyph
  // ("Restor"), so there it gets a fixed width plus trailing padding to keep the
  // text box wider than the glyphs. iOS must stay intrinsically sized — its
  // toolbar renders a glass capsule around the child, and a fixed width there
  // inflates the capsule and strands the label against its edge. Swapping to a
  // spinner rather than a longer label keeps the width constant across states on
  // both platforms, so the header never re-measures.
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel="Restore purchases"
      isDisabled={isRestoring}
      hitSlop={12}
      onPress={handleRestore}
      className="flex-row items-center justify-center android:w-24 android:justify-end android:pr-1 ios:px-3"
    >
      {isRestoring ? (
        <Spinner size="sm" color={tintColor} />
      ) : (
        <AppText numberOfLines={1} className="text-[13px] text-muted android:pr-1">
          Restore
        </AppText>
      )}
    </PressableFeedback>
  );
}
