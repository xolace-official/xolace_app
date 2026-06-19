import { useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";

type DayData = {
  label: string;
  dayName: string;
  intensity: number | null;
  isToday: boolean;
};

type Props = {
  days: DayData[];
  peakDay: string | null;
  hasData: boolean;
  staggerDelay?: number;
};

const BAR_MAX_H = 68;
const BAR_MIN_H = 5;

// Adapted from sample-codes/miles-bar-chart/src/components/weekly-chart/single-bar.tsx
// Progress (0–1) drives height via interpolate and color via interpolateColor.
function IntensityBar({
  intensity,
  isToday,
  isPeak,
  accentHex,
  emberHex,
}: {
  intensity: number | null;
  isToday: boolean;
  isPeak: boolean;
  accentHex: string;
  emberHex: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (intensity === null) return;
    progress.set(intensity / 10);
  }, [intensity, progress]);

  const animatedProgress = useDerivedValue(() => {
    return withSpring(progress.get(), { dampingRatio: 1, duration: 520 });
  });

  const rBarStyle = useAnimatedStyle(() => {
    const height = interpolate(animatedProgress.get(), [0, 1], [BAR_MIN_H, BAR_MAX_H]);
    // Low intensity → muted accent, high → ember
    const backgroundColor = interpolateColor(
      animatedProgress.get(),
      [0, 0.5, 1],
      [accentHex + "28", accentHex + "99", emberHex],
    );
    return { height, backgroundColor };
  });

  if (intensity === null) {
    return (
      <View
        style={{
          height: BAR_MIN_H,
          borderRadius: 6,
          backgroundColor: accentHex + "18",
        }}
      />
    );
  }

  return (
    <Animated.View
      style={[
        {
          borderRadius: 8,
          borderCurve: "continuous",
          opacity: isToday || isPeak ? 1 : 0.65,
        },
        rBarStyle,
      ]}
    />
  );
}

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

export function WeekIntensityCard({ days, peakDay, hasData, staggerDelay = 300 }: Props) {
  const { width } = useWindowDimensions();
  const accentHex = useThemeColor("accent") as string;
  const emberHex = useThemeColor("ember") as string;
  const mutedHex = useThemeColor("muted") as string;
  const surfaceHex = useThemeColor("surface") as string;

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280, easing: EASE, delay: staggerDelay }}
      className="mx-5"
    >
      <View className="rounded-3xl bg-surface border border-border/60 overflow-hidden">
        <View className="px-5 pt-5 pb-4">
          <AppText className="text-[11px] font-medium text-muted mb-5 tracking-widest uppercase">
            This week
          </AppText>

          {hasData ? (
            <View>
              {/* Chart: bars + qualitative y-axis */}
              <View
                className="flex-row"
                style={{ height: BAR_MAX_H + 20 }}
              >
                {/* Bars column */}
                <View className="flex-1 flex-row items-end gap-1.5">
                  {days.map((d, i) => (
                    <View key={i} className="flex-1 items-center gap-1.5">
                      <View style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
                        <IntensityBar
                          intensity={d.intensity}
                          isToday={d.isToday}
                          isPeak={d.dayName === peakDay}
                          accentHex={accentHex}
                          emberHex={emberHex}
                        />
                      </View>
                      <AppText
                        className="text-[10px]"
                        style={{ color: d.isToday ? emberHex : mutedHex + "88" }}
                      >
                        {d.label}
                      </AppText>
                    </View>
                  ))}
                </View>

                {/* Qualitative y-axis */}
                <View
                  className="pl-3 justify-between pb-5"
                  style={{ height: BAR_MAX_H + 20 }}
                >
                  {["High", "Moderate", "Mild", "Minimal"].map((lbl) => (
                    <AppText
                      key={lbl}
                      className="text-[9px] text-right"
                      style={{ color: mutedHex + "55" }}
                    >
                      {lbl}
                    </AppText>
                  ))}
                </View>
              </View>

              {peakDay && (
                <AppText className="text-xs text-muted mt-2">
                  Intensity peaked {peakDay}
                </AppText>
              )}
            </View>
          ) : (
            <AppText className="text-xs text-muted leading-5 pb-1">
              A few more moments and your week starts to take shape.
            </AppText>
          )}
        </View>

        {/* Earlier-weeks premium teaser — frosted, blended into the surface */}
        <View className="relative border-t border-border/30" style={{ height: 46 }}>
          {/* Faint ghost data behind the frost */}
          <View className="absolute inset-0 flex-row items-center px-5">
            <AppText className="text-[10px] text-muted/35 tracking-[0.3em]">
              · · · · · · · · · · · · · · · · · · ·
            </AppText>
          </View>

          <BlurView intensity={18} tint="default" className="absolute inset-0" />
          {/* Surface-tinted scrim so the blur reads as a soft fade, not a grey bar */}
          <LinearGradient
            colors={[surfaceHex + "70", surfaceHex + "E6"]}
            className="absolute inset-0"
          />

          <View className="absolute inset-0 flex-row items-center justify-center gap-2">
            <SymbolView name="lock.fill" size={10} tintColor={mutedHex + "AA"} />
            <AppText className="text-[11px] tracking-wide" style={{ color: mutedHex + "DD" }}>
              Earlier weeks
            </AppText>
          </View>
        </View>
      </View>
    </EaseView>
  );
}
