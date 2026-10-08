// The hero: overall steadiness as a fan of ticks that fill in on mount (#491).
// Lit at two unlocked domains; before that, one line of presence instead.
import { useEffect } from "react";
import { View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { Presets } from "react-native-pulsar";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import { GlassSurface, TickGauge } from "./glass";
import type { Icon } from "./domains";

const GAUGE_ICON = { ios: "gauge.with.needle", android: "speed", web: "speed" } as Icon;

export function OverallDial({ overall }: { overall: number | null }) {
  const accent = useTokenColor("accent");
  const track = useTokenColor("border");
  const progress = useSharedValue(0);

  useEffect(() => {
    if (overall === null) return;
    // A rising swell as the ticks fill: the number arriving, not a reward.
    Presets.swell();
    progress.set(withTiming(overall / 100, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [overall, progress]);

  return (
    <GlassSurface style={{ paddingVertical: 24, alignItems: "center", gap: 12 }}>
      {overall === null ? (
        <AppText className="text-[15px] text-foreground/75 text-center px-8 leading-6">
          Your overall steadiness lights up once Xolace knows two parts of your life.
        </AppText>
      ) : (
        // The 270° sweep leaves its bottom quarter empty; tuck the card up into it.
        <View accessible accessibilityLabel={`Overall steadiness, ${overall} out of 100`} style={{ marginBottom: -28 }}>
          <TickGauge
            ticks={56} startAngle={135} sweep={270} radius={118} tickLength={20} tickWidth={4}
            progress={progress} fill={accent} track={track}
          >
            <View className="flex-row items-center gap-1.5">
              <SymbolView name={GAUGE_ICON} size={14} tintColor={accent} />
              <AppText className="text-[14px] text-accent">overall</AppText>
            </View>
            <AppText className="text-[68px] leading-[76px] font-bold tracking-tight">{overall}</AppText>
            <AppText className="text-[12px] text-muted -mt-1">/100</AppText>
          </TickGauge>
        </View>
      )}
    </GlassSurface>
  );
}
