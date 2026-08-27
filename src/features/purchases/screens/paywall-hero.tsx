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
        className="text-3xl text-center font-bold"
        gradientProps={{ colors: [`${accentColor}80`, accentColor, `${accentColor}80`] }}
      />
      <AppText className="text-sm font-light text-muted text-center leading-6 px-4">
        {"The fire keeps the nights. Plus is where the small thing that keeps coming back shows up early — the third time, not the thirtieth."}
      </AppText>
    </View>
  );
}
