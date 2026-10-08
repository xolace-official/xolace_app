// PROTOTYPE (#491) — floating variant switcher. Params live in the route
// (?variant=&tier=&scenario=) so a state is reload-stable and shareable.
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  variants: { key: string; name: string }[];
  current: string;
  tier: string;
  scenario: string;
  bottom: number;
};

export function PrototypeSwitcher({ variants, current, tier, scenario, bottom }: Props) {
  const router = useRouter();
  if (!__DEV__) return null;
  const i = Math.max(0, variants.findIndex((v) => v.key === current));
  const go = (step: number) =>
    router.setParams({ variant: variants[(i + step + variants.length) % variants.length].key });

  return (
    <View style={{ position: "absolute", bottom, left: 0, right: 0 }} className="items-center" pointerEvents="box-none">
      <View className="rounded-full bg-foreground px-2 py-1.5 flex-row items-center gap-1 shadow-lg">
        <Btn label="‹" onPress={() => go(-1)} />
        <AppText className="text-background text-[13px] font-medium px-1">
          {variants[i].key} · {variants[i].name}
        </AppText>
        <Btn label="›" onPress={() => go(1)} />
        <Btn label={tier} onPress={() => router.setParams({ tier: tier === "plus" ? "free" : "plus" })} pill />
        <Btn label={scenario} onPress={() => router.setParams({ scenario: scenario === "rich" ? "early" : "rich" })} pill />
      </View>
    </View>
  );
}

function Btn({ label, onPress, pill }: { label: string; onPress: () => void; pill?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} className={pill ? "rounded-full bg-background/20 px-3 py-1" : "px-3 py-1"}>
      <AppText className={`text-background ${pill ? "text-[12px]" : "text-[18px] font-bold"}`}>{label}</AppText>
    </Pressable>
  );
}
