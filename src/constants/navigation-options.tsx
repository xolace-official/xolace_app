import { useResolveClassNames } from "uniwind";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";

/**
 * Return navigation options configured for a large transparent header.
 *
 * @returns Navigation options with `headerTintColor` set from the resolved foreground color, `headerTransparent` enabled, `headerBlurEffect` set to `"dark"` when a glass effect is unavailable, `headerLargeStyle` background set to `"transparent"`, and `headerLargeTitle` enabled.
 */
export function useLargeHeaderOptions(): NativeStackNavigationOptions {
   const headerTintColorStyle = useResolveClassNames('bg-foreground')
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
