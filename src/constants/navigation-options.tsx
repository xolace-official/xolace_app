import { useResolveClassNames } from "uniwind";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";

/**
 * Hook that provides reusable large header screen options
 */
export function useLargeHeaderOptions(): NativeStackNavigationOptions {
   const headerTintColorStyle = useResolveClassNames('bg-gray-50 dark:bg-gray-950')
  const isGlassAvailable = isLiquidGlassAvailable();

  return {
    headerTintColor: headerTintColorStyle.backgroundColor as string,
    headerTransparent: true,
    headerBlurEffect: !isGlassAvailable ? "dark" : undefined,
    headerLargeStyle: {
      backgroundColor: "transparent",
    },
    headerLargeTitle: true,
  };
}
