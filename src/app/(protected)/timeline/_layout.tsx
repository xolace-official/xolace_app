import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { useLargeHeaderOptions } from "@/constants/navigation-options";

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
