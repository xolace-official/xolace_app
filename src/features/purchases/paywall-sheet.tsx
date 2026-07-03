import { useEffect, useState } from "react";
import { View } from "react-native";
import { BottomSheet, PressableFeedback } from "heroui-native";
import { useConvexAuth, useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { api } from "@/convex/_generated/api";
import { BottomSheetBlurOverlay } from "@/src/components/bottom-sheet-blur-overlay";
import { AppText } from "@/src/components/shared/app-text";
import { useRevenueCat } from "./revenuecat-context";
import { usePaywall } from "./use-paywall";
import { PaywallPlanCard, type PlanId } from "./paywall-plan-card";

// Fallback display prices while offerings are unavailable
// (appConfig.features.payments=false, or RC still loading).
const FALLBACK = {
  annual: { price: "$44.99/yr", detail: "$3.75/mo, billed yearly" },
  monthly: { price: "$9.99/mo", detail: "billed monthly" },
} as const;

/**
 * Temporary paywall sheet — functional placeholder until the designed one
 * lands. Annual hero w/ 7-day trial badge, monthly anchor, restore link.
 * Mounted once inside RevenueCatProvider; opened via usePaywall.open(surface).
 */
export function PaywallSheet() {
  const posthog = usePostHog();
  const { isOpen, surface, close } = usePaywall();
  const { offerings, purchase, restorePurchases, isProUser } = useRevenueCat();
  const { isAuthenticated } = useConvexAuth();
  const summary = useQuery(api.profile.getSummary, isAuthenticated ? {} : "skip");
  const [selected, setSelected] = useState<PlanId>("annual");
  const [busy, setBusy] = useState(false);

  const annualPkg = offerings?.current?.annual ?? null;
  const monthlyPkg = offerings?.current?.monthly ?? null;

  useEffect(() => {
    if (isOpen) {
      posthog.capture("paywall_opened", {
        surface,
        session_count: summary?.sessionCount ?? null,
      });
    }
    // Re-capture only on open/surface change — summary is attribution detail.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, surface]);

  const dismiss = () => {
    posthog.capture("paywall_dismissed", { surface });
    close();
  };

  const priceOf = (pkg: PurchasesPackage | null, plan: PlanId) =>
    pkg
      ? { price: pkg.product.priceString, detail: FALLBACK[plan].detail }
      : FALLBACK[plan];

  const handleContinue = () => {
    const pkg = selected === "annual" ? annualPkg : monthlyPkg;
    if (!pkg) return; // payments not live yet — CTA is a visual placeholder
    setBusy(true);
    purchase(pkg, surface ?? undefined)
      .then((ok) => {
        if (ok) close(); // server entitlement query flips reactively
      })
      .finally(() => setBusy(false));
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          enableDynamicSizing
          enableOverDrag={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/20"
        >
          <View className="px-6 pt-2 pb-10">
            <AppText className="font-serif text-xl text-foreground text-center">
              Xolace+
            </AppText>
            <AppText className="text-sm font-light text-default-soft text-center mt-1.5 leading-6">
              {"You've been showing up. Xolace+ keeps everything you're building — your patterns, your language, your history — within reach."}
            </AppText>

            <View className="gap-3 mt-7">
              <PaywallPlanCard
                plan="annual"
                title="Annual"
                {...priceOf(annualPkg, "annual")}
                badge="7-day free trial"
                isSelected={selected === "annual"}
                onSelect={setSelected}
              />
              <PaywallPlanCard
                plan="monthly"
                title="Monthly"
                {...priceOf(monthlyPkg, "monthly")}
                isSelected={selected === "monthly"}
                onSelect={setSelected}
              />
            </View>

            <PressableFeedback
              onPress={handleContinue}
              isDisabled={busy || isProUser}
              accessibilityRole="button"
              accessibilityLabel="Continue with selected plan"
              className="mt-7 h-14 rounded-2xl items-center justify-center bg-accent"
            >
              <AppText className="text-base font-medium text-accent-foreground">
                {busy
                  ? "One moment…"
                  : selected === "annual"
                    ? "Start with 7 days free"
                    : "Continue"}
              </AppText>
            </PressableFeedback>

            <PressableFeedback
              onPress={() => restorePurchases()}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
              className="mt-4 items-center"
            >
              <AppText className="text-[13px] text-muted">
                Restore purchases
              </AppText>
            </PressableFeedback>

            <AppText className="text-[11px] text-muted text-center mt-4 leading-4">
              Renews automatically. Cancel anytime in your store settings.
            </AppText>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
