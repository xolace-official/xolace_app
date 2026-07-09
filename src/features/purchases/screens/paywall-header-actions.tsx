import { useLocalSearchParams, useRouter } from "expo-router";
import { CloseButton, LinkButton } from "heroui-native";
import { usePostHog } from "posthog-react-native";
import { useRevenueCat } from "@/src/features/purchases/revenuecat-context";
import type { PaywallSurface } from "@/src/features/purchases/use-paywall";

export function PaywallCloseButton() {
  const router = useRouter();
  const posthog = usePostHog();
  const { surface } = useLocalSearchParams<{ surface?: PaywallSurface }>();

  return (
    <CloseButton
      accessibilityLabel="Close"
      onPress={() => {
        posthog.capture("paywall_dismissed", { surface: surface ?? null });
        router.back();
      }}
    />
  );
}

export function PaywallRestoreButton() {
  const { restorePurchases } = useRevenueCat();

  return (
    <LinkButton size="sm" onPress={() => restorePurchases()}>
      <LinkButton.Label className="text-[13px] text-muted">Restore</LinkButton.Label>
    </LinkButton>
  );
}
