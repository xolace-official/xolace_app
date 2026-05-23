import { forwardRef } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  text: string;
};

const GRADIENT_START: [number, number] = [0, 0];
const GRADIENT_TOP_END: [number, number] = [1, 1];
const SPARKLE_ICON = { ios: "sparkles" as const, android: "auto_awesome" as const };

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

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const cardStyle = { width: cardWidth, height: cardHeight, backgroundColor, overflow: "hidden" as const };
  // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const gradientTopColors: [string, string] = [`${accentColor}22`, "transparent"];
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const gradientTopStyle = { position: "absolute" as const, top: 0, left: 0, right: 0, height: cardHeight * 0.55 };
  // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const gradientBottomColors: [string, string] = ["transparent", `${accentColor}18`];
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const accentLineStyle = { position: "absolute" as const, top: 56, left: 40, width: 32, height: 2, backgroundColor: `${accentColor}60` };
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const quoteTextStyle = { fontSize: 30, fontFamily: "Poppins-SemiBold", lineHeight: 44, color: foregroundColor };
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const brandingChipStyle = { backgroundColor: `${accentColor}18`, borderWidth: 1, borderColor: `${accentColor}30` };
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const brandingLabelStyle = { fontSize: 11, fontFamily: "Poppins-Medium", letterSpacing: 0.5, color: `${accentColor}CC` };
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const storeLinkStyle = { fontSize: 11, fontFamily: "Poppins-Regular", color: `${foregroundColor}30` };

  return (
    <View ref={ref} style={cardStyle}>
      {/* Diagonal accent gradient — top-left warm glow */}
      <LinearGradient
        colors={gradientTopColors}
        start={GRADIENT_START}
        end={GRADIENT_TOP_END}
        style={gradientTopStyle}
        pointerEvents="none"
      />

      {/* Bottom warm gradient */}
      <LinearGradient
        colors={gradientBottomColors}
        style={styles.gradientBottom}
        pointerEvents="none"
      />

      {/* Decorative accent line — top left */}
      <View style={accentLineStyle} />

      {/* Quote text + branding — centered as one block */}
      <View className="flex-1 justify-center" style={styles.contentPadding}>
        <AppText style={quoteTextStyle}>
          {text}
        </AppText>

        {/* Branding sits directly below the quote — hard to crop out */}
        <View className="flex-row items-center gap-3 mt-6">
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
            style={brandingChipStyle}
          >
            <SymbolView
              name={SPARKLE_ICON}
              size={10}
              tintColor={`${accentColor}CC`}
            />
            <AppText style={brandingLabelStyle}>
              Xolace
            </AppText>
          </View>

          <AppText style={storeLinkStyle}>
            {storeLinkLabel}
          </AppText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  gradientBottom: { position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0 },
  contentPadding: { paddingHorizontal: 40 },
});
