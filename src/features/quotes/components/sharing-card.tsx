import { forwardRef } from "react";
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  ImageStyle,
  ViewStyle,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  text: string;
  onMascotLoadEnd?: () => void;
};

const GRADIENT_START: [number, number] = [0, 0];
const GRADIENT_END: [number, number] = [1, 1];
const SPARKLE_ICON = {
  ios: "sparkles" as const,
  android: "auto_awesome" as const,
};

export const SharingCard = forwardRef<View, Props>(function SharingCard(
  { text, onMascotLoadEnd },
  ref,
) {
  const { width } = useWindowDimensions();
  const cardWidth = width;
  const cardHeight = width * (16 / 9);

  const backgroundColor = useThemeColor("background") as string;
  const foregroundColor = useThemeColor("foreground") as string;
  const accentColor = useThemeColor("accent") as string;

  const cardDynamicStyle = {
    width: cardWidth,
    height: cardHeight,
    backgroundColor,
  };

  // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const topGlowColors: [string, string] = [`${accentColor}20`, "transparent"];
  // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const bottomGlowColors: [string, string] = [
    "transparent",
    `${accentColor}18`,
  ];

  const quoteTextStyle = {
    color: foregroundColor,
  };

  const accentLineStyle = {
    backgroundColor: `${accentColor}66`,
  };

  const reminderChipStyle = {
    backgroundColor: `${accentColor}14`,
    borderColor: `${accentColor}2E`,
  };

  const reminderChipTextStyle = {
    color: `${accentColor}D6`,
  };

  const mascotHaloStyle = {
    width: cardWidth * 0.34,
    height: cardWidth * 0.34,
    right: cardWidth * 0.06,
    bottom: cardHeight * 0.12,
    backgroundColor: `${accentColor}14`,
    borderColor: `${accentColor}22`,
  };

  const mascotStyle = {
    width: "100%" as const,
    height: "100%" as const,
    opacity: 0.52,
  };

  const brandChipStyle = {
    backgroundColor: `${accentColor}16`,
    borderColor: `${accentColor}2E`,
  };

  const brandTextStyle = {
    color: `${accentColor}D9`,
  };

  const cardCombinedStyle = StyleSheet.compose(
    styles.card,
    cardDynamicStyle,
  ) as StyleProp<ViewStyle>;
  const mascotHaloCombinedStyle = StyleSheet.compose(
    styles.mascotHalo,
    mascotHaloStyle,
  ) as StyleProp<ViewStyle>;
  const mascotCombinedStyle = StyleSheet.compose(
    styles.mascot,
    mascotStyle,
  ) as StyleProp<ImageStyle>;
  const accentLineCombinedStyle = StyleSheet.compose(
    styles.accentLine,
    accentLineStyle,
  ) as StyleProp<ViewStyle>;
  const reminderChipCombinedStyle = StyleSheet.compose(
    styles.reminderChip,
    reminderChipStyle,
  ) as StyleProp<ViewStyle>;
  const reminderChipTextCombinedStyle = StyleSheet.compose(
    styles.reminderChipText,
    reminderChipTextStyle,
  ) as StyleProp<TextStyle>;
  const brandChipCombinedStyle = StyleSheet.compose(
    styles.brandChip,
    brandChipStyle,
  ) as StyleProp<ViewStyle>;
  const brandTextCombinedStyle = StyleSheet.compose(
    styles.brandText,
    brandTextStyle,
  ) as StyleProp<TextStyle>;
  const quoteTextCombinedStyle = StyleSheet.compose(
    styles.quoteText,
    quoteTextStyle,
  ) as StyleProp<TextStyle>;

  return (
    <View ref={ref} style={cardCombinedStyle}>
      <LinearGradient
        colors={topGlowColors}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.gradientTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={bottomGlowColors}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.gradientBottom}
        pointerEvents="none"
      />

      <View style={mascotHaloCombinedStyle} pointerEvents="none">
        <Image
          source={require("@/assets/images/flux/campfire-mini.jpeg")}
          style={mascotCombinedStyle}
          contentFit="cover"
          pointerEvents="none"
          onLoadEnd={onMascotLoadEnd}
        />
      </View>

      <View style={accentLineCombinedStyle} />

      <View className="flex-1 justify-center" style={styles.contentPadding}>
        <View style={reminderChipCombinedStyle}>
          <SymbolView
            name={SPARKLE_ICON}
            size={10}
            tintColor={`${accentColor}D6`}
          />
          <AppText style={reminderChipTextCombinedStyle}>
            QUIET REMINDER
          </AppText>
        </View>

        <AppText style={quoteTextCombinedStyle}>{text}</AppText>

        <View style={brandChipCombinedStyle}>
          <AppText style={brandTextCombinedStyle}>— xolace</AppText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  quoteText: {
    fontSize: 30,
    lineHeight: 44,
    fontFamily: "Poppins-SemiBold",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  gradientBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  mascotHalo: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  mascot: {
    width: "100%",
    height: "100%",
  },
  accentLine: {
    position: "absolute",
    top: 56,
    left: 40,
    width: 36,
    height: 2,
  },
  contentPadding: {
    paddingHorizontal: 40,
    gap: 18,
  },
  reminderChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  reminderChipText: {
    fontSize: 10,
    letterSpacing: 1.1,
    fontFamily: "Poppins-Medium",
  },
  brandChip: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  brandText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    letterSpacing: 0.3,
  },
});
