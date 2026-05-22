import { View } from "react-native";
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

const ENTRANCE = {
  type: "timing" as const,
  duration: 500,
  easing: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

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
    Presets.ping();
    onReact(next);
  };

  const handleNotToday = () => {
    Presets.ping();
    onReact(reaction === "not_today" ? null : "not_today");
  };

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={ENTRANCE}
      className="flex-1"
    >
      {/* Quote text — vertically centered */}
      <View
        className="flex-1 justify-center px-8"
        style={{ paddingTop: top + 56, paddingBottom: 120 }}
      >
        <View className="w-8 mb-6" style={{ height: 1.5, backgroundColor: `${accentColor}50` }} />
        <AppText
          className="text-3xl font-semibold text-foreground"
          style={{ lineHeight: 42 }}
        >
          {text}
        </AppText>
        <AppText
          className="text-xs mt-5 tracking-widest uppercase"
          style={{ color: `${foregroundColor}40` }}
        >
          {label}
        </AppText>
        {showNudge && (
          <AppText className="text-xs mt-3" style={{ color: `${foregroundColor}30` }}>
            Try a session for a more personal quote.
          </AppText>
        )}
      </View>

      {/* Bottom action bar */}
      <View
        className="flex-row items-end justify-between px-10"
        style={{ paddingBottom: bottom + 32 }}
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
  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={isDisabled}
      hitSlop={16}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View className="items-center gap-2">
        <GlassView
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: isActive ? 1.5 : 1,
            borderColor: isActive ? `${accentColor}60` : `${color}12`,
          }}
          glassEffectStyle="clear"
        >
          <SymbolView
            name={{ ios: iosIcon as any, android: androidIcon as any }}
            size={20}
            tintColor={isActive ? accentColor : `${color}50`}
          />
        </GlassView>
        <AppText
          className="text-xs"
          style={{ color: isActive ? accentColor : `${color}30` }}
        >
          {label}
        </AppText>
      </View>
    </PressableFeedback>
  );
}
