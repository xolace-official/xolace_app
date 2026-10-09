// The compounding upsell (#524, #496 §4): a free user learns a named domain
// has been heavier than their usual, with no number, on Insights and at
// session end. Once per stretch: showing it spends it, so it's held on mount.
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { PressableFeedback } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { usePostHog } from "posthog-react-native";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { usePaywall } from "@/src/features/purchases/use-paywall";
import { usePlusEntitlement } from "@/src/features/purchases/use-plus-entitlement";
import { playSoftPress } from "@/src/lib/haptics";
import { DOMAIN_META } from "./domains";
import { GlassSurface } from "./glass";

export type Upsell = NonNullable<FunctionReturnType<typeof api.compounding.upsell.get>>;

/** Session end passes its session; Insights passes `{}`. Null until there's one to show. */
export function useCompoundingUpsell(args: { sessionId?: Id<"sessions"> } | "skip"): Upsell | null {
  const { isPlus, isResolved } = usePlusEntitlement();
  const live = useQuery(api.compounding.upsell.get, isResolved && !isPlus ? args : "skip");
  const markShown = useMutation(api.compounding.upsell.markShown);
  const posthog = usePostHog();
  // The first answer, held: once marked, the query moves on underneath.
  const [held, setHeld] = useState<Upsell | null>();
  if (held === undefined && live !== undefined) setHeld(live);

  useEffect(() => {
    if (!held) return;
    markShown(held).catch(() => {});
    posthog.capture("plus_upsell_shown", { surface: "compounding_upsell" });
  }, [held, markShown, posthog]);

  return held ?? null;
}

/** The tap, from the line or the domain's row. */
export function useOpenUpsell() {
  const openPaywall = usePaywall((s) => s.open);
  const posthog = usePostHog();
  return () => {
    playSoftPress();
    posthog.capture("plus_upsell_tapped", { surface: "compounding_upsell" });
    openPaywall("compounding_upsell");
  };
}

/**
 * Glass on Insights, like the cards around it. Session end fades its close
 * phase in, and the blur stops rendering under animated opacity: solid there.
 */
export function CompoundingUpsellLine({ upsell, glass = false }: { upsell: Upsell; glass?: boolean }) {
  const ember = useTokenColor("ember");
  const open = useOpenUpsell();
  const { label, icon } = DOMAIN_META[upsell.domain];
  const line = `${label} has been heavier lately than your usual.`;
  const pressable = (
    <PressableFeedback
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${line} See the pattern with Xolace+.`}
      className={`w-full flex-row items-center gap-3 px-4 py-3 ${glass ? "" : "rounded-2xl border border-ember/30 bg-ember/10"}`}
    >
      <View className="size-9 items-center justify-center rounded-xl bg-ember/12">
        <SymbolView name={icon} size={17} tintColor={ember} />
      </View>
      <View className="flex-1 gap-0.5">
        <AppText className="text-[14px] leading-5 text-foreground">{line}</AppText>
        <AppText className="text-[13px] font-semibold text-ember">See the pattern</AppText>
      </View>
    </PressableFeedback>
  );
  return glass ? <GlassSurface radius={24} tint="ember">{pressable}</GlassSurface> : pressable;
}

/** The session-end line: nothing when there's none, or the user has Xolace+. */
export function SessionEndUpsell({ sessionId }: { sessionId?: Id<"sessions"> }) {
  const upsell = useCompoundingUpsell(sessionId ? { sessionId } : "skip");
  return upsell && <CompoundingUpsellLine upsell={upsell} />;
}
