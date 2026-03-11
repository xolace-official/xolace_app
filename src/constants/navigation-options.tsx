import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useThemeColor } from "heroui-native";
import { useAppTheme } from "@/context/app-theme-context";

/**
 * Hook that provides reusable large header screen options
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
