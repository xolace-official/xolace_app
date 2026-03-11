import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { useLargeHeaderOptions } from "@/constants/navigation-options";

/**
 * Settings stack layout with a large transparent header and a back button.
 */
export default function SettingsLayout() {
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

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          ...largeHeaderOptions,
          headerLeft: renderBackButton,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Settings",
          }}
        />
      </Stack>
    </View>
  );
}
