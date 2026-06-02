import { View } from "react-native";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  onPress: () => void;
};

export const BridgeCard = ({ onPress }: Props) => {
  const accentColor = useThemeColor("accent") as string;

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityLabel="Find the words for someone who matters"
      accessibilityRole="button"
      className="w-full rounded-2xl border border-accent/20 bg-surface px-5 py-4"
    >
      <View className="flex-row items-start justify-between mb-2">
        <SymbolView
          name={{ ios: "flame", android: "local_fire_department", web: "local_fire_department" }}
          size={16}
          tintColor={accentColor}
        />
        <AppText className="text-xs text-accent font-medium">· new</AppText>
      </View>
      <AppText className="font-serif text-xl text-foreground mb-1">
        Find the words for someone who matters.
      </AppText>
      <AppText className="text-sm font-light text-foreground/50">
        Turn what you felt into something you can say.
      </AppText>
    </PressableFeedback>
  );
};
