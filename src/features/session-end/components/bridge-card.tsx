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
      accessibilityLabel="Find the words for someone who matters. Suggested for you."
      accessibilityRole="button"
      className="w-full overflow-hidden rounded-3xl border border-accent/30 bg-accent/[0.07] p-5"
    >
      <PressableFeedback.Highlight
        animation={{ backgroundColor: { value: accentColor }, opacity: { value: [0, 0.08] } }}
      />

      {/* Top row: flame chip leads, "suggested" anchor balances the right */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="size-9 items-center justify-center rounded-xl bg-accent/12">
          <SymbolView
            name={{ ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" }}
            size={16}
            tintColor={accentColor}
          />
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-accent/12 px-2.5 py-1">
          <SymbolView
            name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }}
            size={10}
            tintColor={accentColor}
          />
          <AppText className="text-[11px] font-medium text-accent">Suggested for you</AppText>
        </View>
      </View>

      {/* Body */}
      <AppText className="font-serif text-xl text-foreground leading-7 mb-1.5">
        Find the words for someone who matters.
      </AppText>
      <AppText className="text-sm font-light text-foreground/55 leading-5">
        Turn what you felt into something you can say.
      </AppText>

      {/* Footer affordance: makes the card read as a door you open */}
      <View className="h-px bg-accent/15 mt-4 mb-3" />
      <View className="flex-row items-center justify-between">
        <AppText className="text-sm font-medium text-accent">Begin</AppText>
        <SymbolView
          name={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }}
          size={14}
          tintColor={accentColor}
        />
      </View>
    </PressableFeedback>
  );
};
