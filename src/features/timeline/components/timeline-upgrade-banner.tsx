import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { usePaywall } from "@/src/features/purchases/use-paywall";

const BLUR_INTENSITY = 70;

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 20, right: 20 },
  blur: { borderRadius: 24, borderCurve: "continuous", overflow: "hidden" },
});

/**
 * Floating nudge shown once a free user scrolls to the end of the 30-day
 * timeline window and older sessions exist. Mirrors the teaser_viewed /
 * premium_gate_hit funnel used by other locked-insight surfaces.
 */
export function TimelineUpgradeBanner() {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const openPaywall = usePaywall((s) => s.open);

  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    posthog.capture("teaser_viewed", { feature: "timeline_extended" });
  }, [posthog]);

  const handlePress = () => {
    posthog.capture("premium_gate_hit", { feature: "timeline_extended" });
    openPaywall("timeline_extended");
  };

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 260 }}
      style={[styles.wrapper, { bottom: insets.bottom + 12 }]}
    >
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Unlock your full timeline with Xolace+"
      >
        <BlurView intensity={BLUR_INTENSITY} tint="default" style={styles.blur}>
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-overlay/35 border border-foreground/10"
          />
          <View className="px-5 py-4 flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-0.5">
              <AppText className="text-[13px] font-medium text-foreground">
                You&apos;re seeing the last 30 days
              </AppText>
              <AppText className="text-[11px] text-foreground/55">
                Unlock your full timeline with Xolace+
              </AppText>
            </View>
            <AppText className="text-[12px] font-semibold text-accent">
              Unlock
            </AppText>
          </View>
        </BlurView>
      </Pressable>
    </EaseView>
  );
}
