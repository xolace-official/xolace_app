import { Stack } from "expo-router";
import { Platform, View } from "react-native";
import { ThemeToggle } from "@/src/components/shared/theme-toggle";
import { useThemeColor } from "heroui-native";
import { useAppTheme } from "@/src/context/app-theme-context";
import { isLiquidGlassAvailable } from "expo-glass-effect";

export default function ThemeLayout() {
  const { isDark } = useAppTheme();
  const [themeColorForeground, themeColorBackground] = useThemeColor([
    "foreground",
    "background",
  ]);

  const _renderThemeToggle = () => <ThemeToggle />;

  const screenOptions = {
    headerTitleAlign: "center" as const,
    headerTransparent: true,
    headerBlurEffect: isDark ? ("dark" as const) : ("light" as const),
    headerTintColor: themeColorForeground,
    headerStyle: {
      backgroundColor: Platform.select({
        ios: undefined,
        android: themeColorBackground,
      }),
    },
    headerTitleStyle: {
      fontFamily: "Inter_600SemiBold",
    },
    headerRight: _renderThemeToggle,
    headerBackButtonDisplayMode: "generic" as const,
    gestureEnabled: true,
    gestureDirection: "horizontal" as const,
    fullScreenGestureEnabled: !isLiquidGlassAvailable(),
    contentStyle: {
      backgroundColor: themeColorBackground,
    },
  };

  return (
    <View className="flex-1 bg-background">
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" />
      </Stack>
    </View>
  );
}
