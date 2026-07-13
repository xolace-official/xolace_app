import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { LinkButton, PressableFeedback, useThemeColor } from "heroui-native";
import { usePostHog } from "posthog-react-native";
import { useRevenueCat } from "@/src/features/purchases/revenuecat-context";
import type { PaywallSurface } from "@/src/features/purchases/use-paywall";

const CLOSE_ICON_NAME = { ios: "xmark", android: "close", web: "close" } as const;

type CloseProps = {
  surface?: PaywallSurface;
};

export function PaywallCloseButton({ surface }: CloseProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const tintColor = useThemeColor("muted") as string;

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={12}
      onPress={() => {
        posthog.capture("paywall_dismissed", { surface: surface ?? null });
        router.back();
      }}
    >
      <SymbolView name={CLOSE_ICON_NAME} size={16} tintColor={tintColor} />
    </PressableFeedback>
  );
}

export function PaywallRestoreButton() {
  const { restorePurchases } = useRevenueCat();

  return (
    <LinkButton size="sm" onPress={() => restorePurchases()} className="px-3" >
      <LinkButton.Label className="text-[13px] text-muted">Restore</LinkButton.Label>
    </LinkButton>
  );
}
