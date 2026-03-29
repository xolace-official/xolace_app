import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

export const TimelineIcon = () => {
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");

  const handlePress = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(protected)/timeline");
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open your timeline"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border border-border">
        <SymbolView
          name="clock"
          size={18}
          tintColor={foregroundColor}
          style={{ opacity: 0.4 }}
        />
      </View>
    </Pressable>
  );
};
