import { View } from "react-native";
import { Image } from "expo-image";
import { PressableFeedback } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";

const PRIVACY_LINES = [
  "Stays on your device",
  "We never see who",
  "Nothing sends on its own",
];

type Props = {
  onBegin: () => void;
};

export function BridgeIntro({ onBegin }: Props) {
  return (
    <View className="flex-1 px-8 justify-between">
      <View className="flex-1 justify-center items-center gap-6">
        <Image
          source={require("@/assets/images/flux/jump-love-bgremove.png")}
          style={{ width: "65%", aspectRatio: 1 }}
          contentFit="contain"
        />
        <AppText className="font-serif text-3xl text-foreground text-center leading-10">
          A bridge for what you&apos;ve been carrying.
        </AppText>
        <View className="gap-2">
          {PRIVACY_LINES.map((line) => (
            <AppText key={line} className="text-sm font-light text-foreground/40 text-center">
              {line}
            </AppText>
          ))}
        </View>
      </View>

      <View className="pb-8">
        <PressableFeedback
          onPress={onBegin}
          accessibilityLabel="Begin"
          accessibilityRole="button"
          className="w-full rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4"
        >
          <AppText className="text-base text-center text-accent font-medium">Begin</AppText>
        </PressableFeedback>
      </View>
    </View>
  );
}
