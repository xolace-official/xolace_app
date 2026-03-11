import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { useLargeHeaderOptions } from "@/constants/navigation-options";

/**
 * Layout component that provides the Timeline screen container with a configured Stack navigator and header controls.
 *
 * The layout applies large-header options, renders a left back control and a right settings control in the header, and hosts the timeline screen content with a transparent content background.
 *
 * @returns The layout's JSX element rendering the configured Stack and its child screen.
 */
export default function TimelineLayout() {
  const router = useRouter();
  const largeHeaderOptions = useLargeHeaderOptions();
  const tintColor = useThemeColor("foreground") as string;

  const renderBackButton = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <SymbolView
          name={{
            ios: "chevron.left",
            android: "arrow_back",
            web: "arrow_back",
          }}
          size={20}
          tintColor={tintColor}
        />
      </Pressable>
    ),
    [router, tintColor],
  );

  const renderSettingsButton = useCallback(
    () => (
      <Pressable
        onPress={() => {
          /* TODO: navigate to settings */
          router.push("/settings")
        }}
        hitSlop={8}
      >
        <SymbolView
          name={{ ios: "gearshape", android: "settings", web: "settings" }}
          size={20}
          tintColor={tintColor}
        />
      </Pressable>
    ),
    [tintColor],
  );

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          ...largeHeaderOptions,
          headerLeft: renderBackButton,
          headerRight: renderSettingsButton,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Your Timeline",
          }}
        />
      </Stack>
    </View>
  );
}
