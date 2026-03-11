import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

export const TimelineIcon = () => {
  const router = useRouter();

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
        <View className="h-2.5 w-2.5 rounded-full bg-accent" />
      </View>
    </Pressable>
  );
};
