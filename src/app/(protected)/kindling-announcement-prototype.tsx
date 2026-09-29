// PROTOTYPE — throwaway (#457). Never merge. Three layouts of the kindling
// announcement, switchable via `?variant=` + `?tier=` on this one route.
// Open with `bun proto:kindling` (simulator must have the dev build + Metro up).
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import { cn } from "@/src/lib/utils";
import type { VariantProps } from "@/src/features/kindling/announcement-prototype/proto-data";
import { ScatterVariant } from "@/src/features/kindling/announcement-prototype/variant-scatter";
import { GridVariant } from "@/src/features/kindling/announcement-prototype/variant-grid";
import { OrbitVariant } from "@/src/features/kindling/announcement-prototype/variant-orbit";

const VARIANTS = {
  A: { name: "Scatter", C: ScatterVariant },
  B: { name: "Grid", C: GridVariant },
  C: { name: "Orbit", C: OrbitVariant },
} as const;
type V = keyof typeof VARIANTS;
const KEYS = Object.keys(VARIANTS) as V[];

export default function KindlingAnnouncementPrototype() {
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ variant?: V; tier?: "plus" | "free"; last?: string }>();
  const variant: V = p.variant && p.variant in VARIANTS ? p.variant : "A";
  const tier = p.tier === "free" ? "free" : "plus";
  const set = (next: Record<string, string>) => router.setParams(next);
  const cycle = (d: number) => set({ variant: KEYS[(KEYS.indexOf(variant) + d + KEYS.length) % KEYS.length], last: "" });
  const props: VariantProps = {
    variant: tier,
    onSkip: () => set({ last: "onSkip" }),
    onContinue: () => set({ last: "onContinue" }),
    onPaywall: () => set({ last: "onPaywall" }),
  };
  const Current = VARIANTS[variant].C;

  if (process.env.NODE_ENV === "production") return null;

  return (
    <View className="flex-1 bg-background">
      <Current key={`${variant}-${tier}`} {...props} />

      {/* Prototype control bar — not part of any design. */}
      <View
        className="absolute left-3 right-3 flex-row items-center gap-1.5 rounded-2xl bg-foreground/90 p-2"
        style={{ bottom: insets.bottom + 4 }}
      >
        <Pill label="‹" onPress={() => cycle(-1)} />
        <AppText className="flex-1 text-center text-[11px] text-background" numberOfLines={1}>
          {`PROTO · ${variant} ${VARIANTS[variant].name}${p.last ? ` · ${p.last}` : ""}`}
        </AppText>
        <Pill on={tier === "free"} label={tier} onPress={() => set({ tier: tier === "free" ? "plus" : "free" })} />
        <Pill label="›" onPress={() => cycle(1)} />
      </View>
    </View>
  );
}

const Pill = ({ on, label, onPress }: { on?: boolean; label: string; onPress: () => void }) => (
  <PressableFeedback onPress={onPress} className={cn("rounded-full px-3 py-1", on ? "bg-background" : "bg-background/15")}>
    <AppText className={cn("text-[12px]", on ? "text-foreground" : "text-background")}>{label}</AppText>
  </PressableFeedback>
);
