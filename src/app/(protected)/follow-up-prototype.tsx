// PROTOTYPE — throwaway (#446). Branch prototype/follow-up-v2-ui only; never merge.
// Open with `bun proto:follow-up` (simulator must have the dev build + Metro up).
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import { cn } from "@/src/lib/utils";
import type { Step, Tier, VariantProps } from "@/src/features/reflect/follow-up-prototype/proto-data";
import { StackVariant } from "@/src/features/reflect/follow-up-prototype/variant-stack";
import { ScaleVariant } from "@/src/features/reflect/follow-up-prototype/variant-scale";
import { ChatVariant } from "@/src/features/reflect/follow-up-prototype/variant-chat";

const VARIANTS = {
  A: { name: "Stack", C: StackVariant },
  B: { name: "Scale", C: ScaleVariant },
  C: { name: "Chat", C: ChatVariant },
} as const;
type V = keyof typeof VARIANTS;
const STEPS: Step[] = ["picker", "lighter", "processed", "still_here", "heavier"];

export default function FollowUpPrototype() {
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ variant?: V; step?: Step; tier?: Tier; last?: string }>();
  const variant: V = p.variant && p.variant in VARIANTS ? p.variant : "A";
  const step: Step = p.step ?? "picker";
  const tier: Tier = p.tier ?? "standard";
  const set = (next: Record<string, string>) => router.setParams(next);
  const props: VariantProps = {
    tier,
    step,
    go: (s) => set({ step: s, last: `chose ${s}` }),
    act: (what) => set({ last: what }),
  };
  const Current = VARIANTS[variant].C;

  return (
    <View className="flex-1 bg-background">
      <Current key={`${variant}-${step}-${tier}`} {...props} />

      {/* Prototype control bar — not part of any design. */}
      <View
        className="absolute left-3 right-3 gap-1.5 rounded-2xl bg-foreground/90 p-2"
        style={{ bottom: insets.bottom + 4 }}
      >
        <AppText className="px-1 text-[10px] text-background/70" numberOfLines={1}>
          {`PROTOTYPE · ${variant} ${VARIANTS[variant].name} · step=${step} · tier=${tier}${p.last ? ` · ${p.last}` : ""}`}
        </AppText>
        <Row>
          {(Object.keys(VARIANTS) as V[]).map((v) => (
            <Pill key={v} on={v === variant} label={`${v} ${VARIANTS[v].name}`} onPress={() => set({ variant: v, last: "" })} />
          ))}
          <Pill on={tier === "acute"} label="acute" onPress={() => set({ tier: tier === "acute" ? "standard" : "acute" })} />
        </Row>
        <Row>
          {STEPS.map((s) => (
            <Pill key={s} on={s === step} label={s.replace("_", " ")} onPress={() => set({ step: s, last: "" })} />
          ))}
        </Row>
      </View>
    </View>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => <View className="flex-row flex-wrap gap-1">{children}</View>;

const Pill = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
  <PressableFeedback onPress={onPress} className={cn("rounded-full px-2.5 py-1", on ? "bg-background" : "bg-background/15")}>
    <AppText className={cn("text-[11px]", on ? "text-foreground" : "text-background")}>{label}</AppText>
  </PressableFeedback>
);
