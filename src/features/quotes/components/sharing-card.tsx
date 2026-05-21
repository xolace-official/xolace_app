import { forwardRef } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";

const IOS_STORE_URL = "https://apps.apple.com/app/xolace/id6741088509";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.xolaceincorg.xolace";

type Props = {
  text: string;
};

/**
 * Branded sharing card for react-native-view-shot capture.
 * Dimensions: 9:16 (WhatsApp status compatible).
 */
export const SharingCard = forwardRef<View, Props>(function SharingCard(
  { text },
  ref
) {
  const { width } = useWindowDimensions();
  const cardWidth = width;
  const cardHeight = width * (16 / 9);

  const backgroundColor = useThemeColor("background") as string;
  const accentColor = useThemeColor("accent") as string;
  const foregroundColor = useThemeColor("foreground") as string;

  const storeLinkLabel = Platform.OS === "ios" ? "App Store" : "Google Play";

  return (
    <View
      ref={ref}
      style={{ width: cardWidth, height: cardHeight, backgroundColor, overflow: "hidden" }}
    >
      {/* Quote — centered vertically */}
      <View className="flex-1 justify-center px-9" style={{ paddingBottom: 80 }}>
        <AppText
          style={{
            fontSize: 28,
            fontFamily: "Poppins_600SemiBold",
            lineHeight: 40,
            color: foregroundColor,
          }}
        >
          {text}
        </AppText>
      </View>

      {/* Bottom gradient */}
      <LinearGradient
        colors={["transparent", `${accentColor}1A`]}
        style={{ position: "absolute", top: "60%", left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      {/* Wordmark + store link strip */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-9"
        style={{ paddingBottom: 40 }}
      >
        <AppText
          style={{
            fontSize: 12,
            fontFamily: "Poppins_400Regular",
            letterSpacing: 1,
            color: `${foregroundColor}99`,
          }}
        >
          Xolace
        </AppText>
        <AppText
          style={{
            fontSize: 12,
            fontFamily: "Poppins_400Regular",
            color: `${foregroundColor}66`,
          }}
        >
          {storeLinkLabel}
        </AppText>
      </View>
    </View>
  );
});
