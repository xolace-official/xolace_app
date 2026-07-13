import { View, StyleSheet, Platform } from "react-native";
import { BlurView, BlurViewProps } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useThemeColor } from "heroui-native";
import { cn } from "@/src/lib/utils";

type Props = {
  position?: "top" | "bottom";
  height?: number;
  blurViewProps?: BlurViewProps;
};

/**
 * ProgressiveBlurView — top/bottom fade-to-blur edge, e.g. under a status bar
 * or behind a sticky CTA. The iOS mask gradient (black/transparent) is a
 * luminance mask, not visible UI color, so it stays hardcoded. The
 * Android-fallback gradient uses the theme background color so the tint
 * stays correct across themes.
 */
export function ProgressiveBlurView({ position = "top", height = 100, blurViewProps }: Props) {
  const backgroundColor = useThemeColor("background") as string;

  // MaskedView takes the mask as an element; React Compiler memoizes it.
  const mask = (
    // eslint-disable-next-line react-perf/jsx-no-jsx-as-prop
    <LinearGradient
      locations={position === "top" ? [0.5, 0.75, 1] : [0, 0.25, 0.5]}
      colors={
        position === "top"
          ? ["black", "#00000080", "transparent"]
          : ["transparent", "#00000080", "black"]
      }
      style={StyleSheet.absoluteFill}
    />
  );

  return (
    <View
      className={cn(
        "absolute left-0 right-0 pointer-events-none",
        position === "top" ? "top-0" : "bottom-0",
      )}
      style={{ height }}
    >
      {Platform.OS === "ios" ? (
        <MaskedView maskElement={mask} style={StyleSheet.absoluteFill}>
          <BlurView
            style={[StyleSheet.absoluteFill, blurViewProps?.style]}
            intensity={blurViewProps?.intensity ?? 70}
            {...blurViewProps}
          />
        </MaskedView>
      ) : (
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={
            position === "top"
              ? [`${backgroundColor}E6`, `${backgroundColor}00`]
              : [`${backgroundColor}00`, `${backgroundColor}E6`]
          }
        />
      )}
    </View>
  );
}
