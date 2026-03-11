import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useThemeColor } from "heroui-native";
import { useAppTheme } from "@/context/app-theme-context";

/**
 * Return navigation options configured for a large transparent header.
 *
 * @returns Navigation options with `headerTintColor` set from the resolved foreground color, `headerTransparent` enabled, `headerBlurEffect` set to `"dark"` when a glass effect is unavailable, `headerLargeStyle` background set to `"transparent"`, and `headerLargeTitle` enabled.
 */
export function useLargeHeaderOptions(): NativeStackNavigationOptions {
  const headerTintColor = useThemeColor("foreground");
  const { isDark } = useAppTheme();
  const isGlassAvailable = isLiquidGlassAvailable();

  return {
    headerTintColor,
    headerTransparent: true,
    headerBlurEffect: !isGlassAvailable
      ? isDark
        ? "dark"
        : "light"
      : undefined,
    headerLargeStyle: {
      backgroundColor: "transparent",
    },
    headerLargeTitle: true,
  };
}
