// PROTOTYPE (#491) — Variant D "By the fire": full-bleed photo hero (ref: the
// breathing app) with the dial on a glass disc over it. The photo is a fixed
// palette (like the Lantern cover); a scrim into --background makes it sit in
// any theme. Dark themes swap to the night photo.
import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Chip } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/src/components/shared/app-text";
import { useAppTheme } from "@/src/context/app-theme-context";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { SteadinessRing } from "./steadiness-ring";
import { DomainSection } from "./domain-grid";
import { GlassSurface } from "./glass";
import { TrendChip } from "./trend-chip";
import { Caveat } from "./kindling-actions";
import { overallFor, type Domain, type Icon, type Tier } from "./mock";

const DAY = require("@/assets/images/flux/campfire-mini.jpeg");
const NIGHT = require("@/assets/images/flux/plus-postcard-bg.png");
const FLAME = { ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" } as Icon;
const HERO = 440;
const DIAL = 230;

export const name = "By the fire";

export function VariantD({ domains, tier }: { domains: Domain[]; tier: Tier }) {
  const plus = tier === "plus";
  const overall = overallFor(domains);
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const bg = useTokenColor("background");
  const accent = useTokenColor("accent");

  return (
    <View className="gap-8" style={{ marginTop: -(insets.top + 64) }}>
      <View style={{ height: HERO }}>
        <Image source={isDark ? NIGHT : DAY} contentFit="cover" contentPosition="top" style={{ position: "absolute", inset: 0 }} />
        <LinearGradient colors={[bg + "00", bg + "00", bg]} locations={[0, 0.55, 1]} style={{ position: "absolute", inset: 0 }} />
      </View>

      <View className="items-center gap-3" style={{ marginTop: -DIAL * 0.75 }}>
        {overall ? (
          <>
            <GlassSurface radius={DIAL / 2} style={{ width: DIAL, height: DIAL }}>
              <SteadinessRing size={DIAL} stroke={5} knob value={overall.score} baseline={plus ? overall.baseline : null}>
                <View className="flex-row items-center gap-1.5">
                  <SymbolView name={FLAME} size={13} tintColor={accent} />
                  <AppText className="text-[13px] text-accent">overall</AppText>
                </View>
                <AppText className="text-[64px] leading-[72px] font-bold tracking-tight">{overall.score}</AppText>
                <Chip size="sm" variant="secondary" color="default" className="self-center">
                  <Chip.Label>{overall.score >= overall.baseline ? "Steady" : "A little heavier"}</Chip.Label>
                </Chip>
              </SteadinessRing>
            </GlassSurface>
            <TrendChip delta={overall.weekDelta} size="md" />
          </>
        ) : (
          <AppText className="text-[15px] text-foreground/75 text-center px-10 leading-6">
            Your overall ring lights up once Xolace knows two parts of your life.
          </AppText>
        )}
      </View>

      <DomainSection domains={domains} plus={plus} />
      <Caveat />
    </View>
  );
}
