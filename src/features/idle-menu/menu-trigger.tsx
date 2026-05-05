import { View } from "react-native";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { playSoftPress } from "@/src/lib/haptics";

type Props = {
  onPress: () => void;
};

export const MenuTrigger = ({ onPress }: Props) => {
  const foregroundColor = useThemeColor("foreground");

  const handlePress = () => {
    playSoftPress();
    onPress();
  };

  return (
    <PressableFeedback
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      accessibilityHint="Opens navigation options: Vent, Timeline, Settings"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border border-accent">
        <SymbolView
          name={{ ios: "ellipsis", android: "more_horiz" }}
          size={20}
          tintColor={foregroundColor}
          style={{ opacity: 0.5 }}
        />
      </View>
    </PressableFeedback>
  );
};
