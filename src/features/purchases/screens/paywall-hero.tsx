import { View } from "react-native";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { GradientText } from "./gradient-text";

export function PaywallHero() {
  const accentColor = useThemeColor("accent") as string;

  return (
    <View className="gap-3 items-center">
      <GradientText
        text="Xolace+"
        className="font-serif text-3xl text-center"
        gradientProps={{ colors: [`${accentColor}80`, accentColor, `${accentColor}80`] }}
      />
      <AppText className="text-sm font-light text-default-soft text-center leading-6 px-4">
        {"You've been showing up. Xolace+ keeps everything you're building — your patterns, your language, your history — within reach."}
      </AppText>
    </View>
  );
}
