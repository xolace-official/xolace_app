import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useThemeColor } from "heroui-native";
import { useAppTheme } from "@/src/context/app-theme-context";

/**
 * Return navigation options for a styled header.
 * iOS: large transparent header with blur/glass effect.
 * Android: standard header with themed background color.
 */
export function useLargeHeaderOptions(): NativeStackNavigationOptions {
  const headerTintColor = useThemeColor("foreground");
  const backgroundColor = useThemeColor("background");
  const { isDark } = useAppTheme();

  if (Platform.OS === "android") {
    return {
      headerTintColor,
      headerStyle: { backgroundColor },
      headerShadowVisible: false,
    };
  }

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
    headerLargeTitleStyle: {
      color: headerTintColor,
    },
    headerLargeTitle: true,
  };
}
