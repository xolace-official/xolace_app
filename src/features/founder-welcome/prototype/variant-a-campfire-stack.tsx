import { ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { PressableFeedback } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";

import { FounderMarquee } from "./founder-marquee";
import { LetterBody } from "./letter-body";
import { FOUNDER_MESSAGE, type AudienceKey } from "./letter-copy";

// VARIANT A — "Campfire Stack" (chosen, #236). Closest to biscuit-camera: a
// full-bleed horizontal marquee band across the top, the letter scrolling
// beneath it with gradient fades top & bottom, a pinned solid CTA.

type Props = { audience: AudienceKey; onAdvance: () => void };

export const VariantACampfireStack = ({ audience, onAdvance }: Props) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cta = FOUNDER_MESSAGE.cta[audience];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ height: 220 }}>
        <FounderMarquee cardWidth={150} cardHeight={200} viewport={width} />
      </View>

      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48, gap: 20 }}
        >
          <AppText className="text-foreground text-lg" style={{ fontFamily: "Poppins-Light" }}>
            {FOUNDER_MESSAGE.greeting}
          </AppText>
          <LetterBody audience={audience} paragraphClassName="text-foreground/80 text-[15px]" gap={16} />
          <View className="mt-6 flex-row items-center gap-3">
            <Image
              source={require("@/assets/images/founder-images/Nathan-mini.jpeg")}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
              contentPosition="top"
            />
            <AppText className="text-foreground/70 text-[15px]" style={{ fontFamily: "Poppins-Italic" }}>
              Nathaniel, Accra
            </AppText>
          </View>
        </ScrollView>

        <View pointerEvents="none" className="absolute left-0 right-0 top-0 h-10">
          <LinearGradient colors={["rgba(0,0,0,0.35)", "transparent"]} style={{ flex: 1 }} />
        </View>
        <View pointerEvents="none" className="absolute left-0 right-0 bottom-0 h-16">
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.35)"]} style={{ flex: 1 }} />
        </View>
      </View>

      <View className="px-6 pt-2">
        <PressableFeedback
          onPress={onAdvance}
          className="bg-accent rounded-2xl h-14 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={cta}
        >
          <AppText className="text-white text-base" style={{ fontFamily: "Poppins-Medium" }}>
            {cta}
          </AppText>
        </PressableFeedback>
      </View>
    </View>
  );
};
