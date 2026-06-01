import { StyleSheet, View } from "react-native";
import { GlassView } from "expo-glass-effect";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { Presets } from "react-native-pulsar";

type Reaction = "resonates" | "not_today" | null | undefined;

type Props = {
  text: string;
  type: "session" | "curated";
  reaction: Reaction;
  onReact: (reaction: Reaction) => void;
  onShare: () => void;
  onHeartBurst: () => void;
  isSharingLoading?: boolean;
  top: number;
  bottom: number;
  showNudge?: boolean;
};

const NUDGE_ICON = { ios: "wand.and.stars" as const, android: "auto_fix_high" as const };
const EASING: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const EASE_INITIAL = { opacity: 0, translateY: 24 };
const EASE_ANIMATE = { opacity: 1, translateY: 0 };
const ENTRANCE = { type: "timing" as const, duration: 500, easing: EASING };

export function QuoteCard({
  text,
  type,
  reaction,
  onReact,
  onShare,
  onHeartBurst,
  isSharingLoading,
  top,
  bottom,
  showNudge,
}: Props) {
  const accentColor = useThemeColor("accent") as string;
  const foregroundColor = useThemeColor("foreground") as string;

  const label = type === "session" ? "From your sessions" : "For you today";

  const handleHeart = () => {
    const next: Reaction = reaction === "resonates" ? null : "resonates";
    if (next === "resonates") onHeartBurst();
    Presets.chirp();
    onReact(next);
  };

  const handleNotToday = () => {
    Presets.wane();
    onReact(reaction === "not_today" ? null : "not_today");
  };

  const topBarStyle = { paddingTop: top + 56, paddingBottom: 120 };
  const accentLineStyle = { height: 1.5, backgroundColor: `${accentColor}50` };
  const labelStyle = { color: `${foregroundColor}40` };
  const nudgePillStyle = { backgroundColor: `${accentColor}18`, borderWidth: 1, borderColor: `${accentColor}35`, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row" as const, alignItems: "center" as const, alignSelf: "flex-start" as const, gap: 6 };
  const nudgeTextStyle = { color: `${accentColor}CC` };
  const bottomBarStyle = { paddingBottom: bottom + 32 };

  return (
    <EaseView
      initialAnimate={EASE_INITIAL}
      animate={EASE_ANIMATE}
      transition={ENTRANCE}
      className="flex-1"
    >
      {/* Quote text — vertically centered */}
      <View
        className="flex-1 justify-center px-8"
        style={topBarStyle}
      >
        <View className="w-8 mb-6" style={accentLineStyle} />
        <AppText
          className="text-3xl font-semibold text-foreground"
          style={styles.quoteLine}
        >
          {text}
        </AppText>
        <AppText
          className="text-xs mt-5 tracking-widest uppercase"
          style={labelStyle}
        >
          {label}
        </AppText>
        {showNudge && (
          <View className="mt-5" style={nudgePillStyle}>
            <SymbolView name={NUDGE_ICON} size={12} tintColor={`${accentColor}CC`} />
            <AppText className="text-xs font-medium" style={nudgeTextStyle}>
              Reflect often, your quotes get more personal
            </AppText>
          </View>
        )}
      </View>

      {/* Bottom action bar */}
      <View
        className="flex-row items-end justify-between px-10"
        style={bottomBarStyle}
      >
        {/* Share */}
        <ActionButton
          iosIcon={isSharingLoading ? "arrow.2.circlepath" : "square.and.arrow.up"}
          androidIcon={isSharingLoading ? "refresh" : "share"}
          label="Share"
          color={foregroundColor}
          accentColor={accentColor}
          isActive={false}
          isDisabled={!!isSharingLoading}
          onPress={onShare}
        />

        {/* Not today */}
        <ActionButton
          iosIcon={reaction === "not_today" ? "moon.fill" : "moon"}
          androidIcon={reaction === "not_today" ? "bedtime" : "bedtime_off"}
          label="Not today"
          color={foregroundColor}
          accentColor={accentColor}
          isActive={reaction === "not_today"}
          onPress={handleNotToday}
        />

        {/* Resonates */}
        <ActionButton
          iosIcon={reaction === "resonates" ? "heart.fill" : "heart"}
          androidIcon={reaction === "resonates" ? "favorite" : "favorite_border"}
          label="Resonates"
          color={foregroundColor}
          accentColor={accentColor}
          isActive={reaction === "resonates"}
          onPress={handleHeart}
        />
      </View>
    </EaseView>
  );
}

type ActionButtonProps = {
  iosIcon: string;
  androidIcon: string;
  label: string;
  color: string;
  accentColor: string;
  isActive: boolean;
  isDisabled?: boolean;
  onPress: () => void;
};

function ActionButton({
  iosIcon,
  androidIcon,
  label,
  color,
  accentColor,
  isActive,
  isDisabled,
  onPress,
}: ActionButtonProps) {
  const glassStyle = { width: 52, height: 52, borderRadius: 26, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: isActive ? `${accentColor}18` : `${color}08`, borderWidth: isActive ? 1.5 : 1, borderColor: isActive ? `${accentColor}60` : `${color}12` };
  const symbolName = { ios: iosIcon as any, android: androidIcon as any };
  const labelStyle = { color: isActive ? accentColor : `${color}30` };

  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={isDisabled}
      hitSlop={16}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View className="items-center gap-2">
        <GlassView style={glassStyle} glassEffectStyle="clear">
          <SymbolView
            name={symbolName}
            size={20}
            tintColor={isActive ? accentColor : `${color}50`}
          />
        </GlassView>
        <AppText className="text-xs" style={labelStyle}>
          {label}
        </AppText>
      </View>
    </PressableFeedback>
  );
}

const styles = StyleSheet.create({
  quoteLine: { lineHeight: 42 },
});
