import { forwardRef } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  text: string;
};

/**
 * Branded sharing card for react-native-view-shot capture.
 * Dimensions: 9:16 (WhatsApp status / IG Stories compatible).
 */
export const SharingCard = forwardRef<View, Props>(function SharingCard({ text }, ref) {
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
      {/* Diagonal accent gradient — top-left warm glow */}
      <LinearGradient
        colors={[`${accentColor}22`, "transparent"]}
        start={[0, 0]}
        end={[1, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: cardHeight * 0.55 }}
        pointerEvents="none"
      />

      {/* Bottom warm gradient */}
      <LinearGradient
        colors={["transparent", `${accentColor}18`]}
        style={{ position: "absolute", top: "50%", left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      {/* Decorative accent line — top left */}
      <View
        style={{
          position: "absolute",
          top: 56,
          left: 40,
          width: 32,
          height: 2,
          backgroundColor: `${accentColor}60`,
        }}
      />

      {/* Quote text — centered */}
      <View
        className="flex-1 justify-center"
        style={{ paddingHorizontal: 40, paddingBottom: 80 }}
      >
        <AppText
          style={{
            fontSize: 30,
            fontFamily: "Poppins-SemiBold",
            lineHeight: 44,
            color: foregroundColor,
          }}
        >
          {text}
        </AppText>
      </View>

      {/* Wordmark strip */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between"
        style={{ paddingHorizontal: 40, paddingBottom: 44 }}
      >
        {/* Badge */}
        <View
          className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ backgroundColor: `${accentColor}18`, borderWidth: 1, borderColor: `${accentColor}30` }}
        >
          <SymbolView
            name={{ ios: "sparkles", android: "auto_awesome" }}
            size={10}
            tintColor={`${accentColor}CC`}
          />
          <AppText
            style={{
              fontSize: 11,
              fontFamily: "Poppins-Medium",
              letterSpacing: 0.5,
              color: `${accentColor}CC`,
            }}
          >
            Xolace
          </AppText>
        </View>

        <AppText
          style={{
            fontSize: 11,
            fontFamily: "Poppins-Regular",
            color: `${foregroundColor}40`,
          }}
        >
          {storeLinkLabel}
        </AppText>
      </View>
    </View>
  );
});
