import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { useLargeHeaderOptions } from "@/src/lib/navigation-options";

/**
 * Settings stack layout with a large transparent header and a back button.
 */
const BACK_ICON_NAME = { ios: "chevron.left", android: "arrow_back", web: "arrow_back" } as const;
const SETTINGS_OPTIONS = { title: "Settings" };
const APPEARANCE_OPTIONS = { title: "Appearance" };

export default function SettingsLayout() {
  const router = useRouter();
  const largeHeaderOptions = useLargeHeaderOptions();
  const tintColor = useThemeColor("foreground") as string;

  const renderBackButton = () => (
    <Pressable onPress={() => router.back()} hitSlop={8}>
      <SymbolView
        name={BACK_ICON_NAME}
        size={20}
        tintColor={tintColor}
      />
    </Pressable>
  );

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const screenOptions = {
    ...largeHeaderOptions,
    headerLeft: renderBackButton,
    contentStyle: { backgroundColor: "transparent" },
  };

  return (
    <View className="flex-1 bg-background">
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={SETTINGS_OPTIONS} />
        <Stack.Screen name="appearance" options={APPEARANCE_OPTIONS} />
      </Stack>
    </View>
  );
}
