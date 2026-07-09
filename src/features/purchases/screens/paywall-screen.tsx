import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useConvexAuth, useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { api } from "@/convex/_generated/api";
import { useRevenueCat } from "@/src/features/purchases/revenuecat-context";
import type { PaywallSurface } from "@/src/features/purchases/use-paywall";
import { PaywallHero } from "./paywall-hero";
import { PaywallFeatureSection } from "./paywall-feature-section";
import { PaywallFeatureItem } from "./paywall-feature-item";
import { PaywallPeriodPicker, type PlanId } from "./paywall-period-picker";
import { PaywallCta } from "./paywall-cta";
import { ProgressiveBlurView } from "./progressive-blur-view";
import { PAYWALL_SURFACE_FEATURE } from "./paywall-surface-map";

// Fallback display prices while offerings are unavailable
// (appConfig.features.payments=false, or RC still loading).
const FALLBACK = {
  annual: { price: "$49.99/yr", detail: "$4.17/mo, billed yearly" },
  monthly: { price: "$9.99/mo", detail: "billed monthly" },
} as const;

type Props = {
  surface?: PaywallSurface;
};

export function PaywallScreen({ surface }: Props) {
  const router = useRouter();
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const { offerings, purchase, isProUser } = useRevenueCat();
  const { isAuthenticated } = useConvexAuth();
  const summary = useQuery(api.profile.getSummary, isAuthenticated ? {} : "skip");
  const [selected, setSelected] = useState<PlanId>("annual");
  const [busy, setBusy] = useState(false);
  const [ctaHeight, setCtaHeight] = useState(0);

  const annualPkg = offerings?.current?.annual ?? null;
  const monthlyPkg = offerings?.current?.monthly ?? null;
  const highlightedFeature = surface ? PAYWALL_SURFACE_FEATURE[surface] : null;

  useEffect(() => {
    posthog.capture("paywall_opened", {
      surface: surface ?? null,
      session_count: summary?.sessionCount ?? null,
    });
    // Fire once on mount — summary is attribution detail, not a re-fire trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        if (ok) router.back(); // server entitlement query flips reactively
      })
      .finally(() => setBusy(false));
  };

  const ctaLabel = busy
    ? "One moment…"
    : selected === "annual"
      ? "Start with 7 days free"
      : "Continue";

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: ctaHeight + 24 }]}
      >
        <PaywallHero />

        <PaywallFeatureSection title="New Level Unlocked">
          <PaywallFeatureItem
            id="insights"
            icon="chart.line.uptrend.xyaxis"
            title="Pattern & language insights"
            description="See how your words and intensity shift over time"
            isHighlighted={highlightedFeature === "insights"}
          />
          <PaywallFeatureItem
            id="mirror_tone"
            icon="waveform"
            title="Mirror voice & tone"
            description="Choose how your reflections are spoken back to you"
            isHighlighted={highlightedFeature === "mirror_tone"}
          />
          <PaywallFeatureItem
            id="quotes"
            icon="text.quote"
            title="Personalized quotes"
            description="Daily language drawn from your own reflections"
            isHighlighted={highlightedFeature === "quotes"}
          />
        </PaywallFeatureSection>

        <PaywallFeatureSection title="Make It Yours">
          <PaywallFeatureItem
            id="themes"
            icon="paintpalette.fill"
            title="Premium themes"
            isHighlighted={highlightedFeature === "themes"}
          />
          <PaywallFeatureItem
            id="avatars"
            icon="person.crop.circle.fill"
            title="Custom avatars"
            isHighlighted={highlightedFeature === "avatars"}
          />
          <PaywallFeatureItem
            id="timeline"
            icon="clock.arrow.circlepath"
            title="Extended timeline"
            description="Look back further than the last few weeks"
            isHighlighted={highlightedFeature === "timeline"}
          />
          <PaywallFeatureItem
            id="caps"
            icon="bolt.fill"
            title="Higher daily limits"
            description="More reflections and vents per day"
            isHighlighted={highlightedFeature === "caps"}
          />
        </PaywallFeatureSection>

        <PaywallPeriodPicker
          annual={priceOf(annualPkg, "annual")}
          monthly={priceOf(monthlyPkg, "monthly")}
          selected={selected}
          onSelect={setSelected}
        />
      </ScrollView>

      <ProgressiveBlurView position="top" height={insets.top + 60} />
      <ProgressiveBlurView position="bottom" height={ctaHeight + 100} />

      <View
        className="absolute bottom-0 left-0 right-0 px-5"
        style={{ paddingBottom: insets.bottom + 12 }}
        onLayout={(e) => setCtaHeight(e.nativeEvent.layout.height)}
      >
        <PaywallCta label={ctaLabel} onPress={handleContinue} isDisabled={busy || isProUser} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, gap: 32 },
});
