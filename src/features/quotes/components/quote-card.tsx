import { View } from "react-native";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { Presets } from "react-native-pulsar";
import type { Id } from "@/convex/_generated/dataModel";

type Reaction = "resonates" | "not_today" | null | undefined;

type Props = {
  quoteId: Id<"daily_quotes">;
  text: string;
  type: "session" | "curated";
  isFirstSessionDerived?: boolean;
  reaction: Reaction;
  onReact: (reaction: Reaction) => void;
  onShare: () => void;
  isSharingLoading?: boolean;
};

export function QuoteCard({
  quoteId,
  text,
  type,
  isFirstSessionDerived,
  reaction,
  onReact,
  onShare,
  isSharingLoading,
}: Props) {
  const accentColor = useThemeColor("accent") as string;

  const label =
    type === "session"
      ? isFirstSessionDerived
        ? "From your sessions — for the first time"
        : "From your sessions"
      : "For you today";

  const handleReact = (r: "resonates" | "not_today") => {
    Presets.ping();
    onReact(reaction === r ? null : r);
  };

  return (
    <View className="rounded-2xl bg-surface p-6">
      {/* Header row: label + share button */}
      <View className="flex-row items-center justify-between mb-5">
        <AppText
          className="text-xs text-foreground/40"
          accessibilityLabel={`${label}: ${text}`}
        >
          {label}
        </AppText>
        <PressableFeedback
          onPress={onShare}
          isDisabled={isSharingLoading}
          accessibilityLabel="Share this quote"
          accessibilityRole="button"
          hitSlop={8}
          className={isSharingLoading ? "opacity-50" : "opacity-100"}
        >
          {isSharingLoading ? (
            <SymbolView
              name={{ ios: "arrow.2.circlepath", android: "refresh" }}
              size={20}
              tintColor={accentColor}
            />
          ) : (
            <SymbolView
              name={{ ios: "square.and.arrow.up", android: "share" }}
              size={20}
              tintColor={accentColor}
            />
          )}
        </PressableFeedback>
      </View>

      {/* Quote text */}
      <AppText className="text-2xl font-semibold text-foreground leading-snug mb-6">
        {text}
      </AppText>

      {/* Reaction pills */}
      <View className="flex-row gap-3">
        <ReactionPill
          label="Resonates"
          iosIcon="heart"
          androidIcon="favorite_border"
          isSelected={reaction === "resonates"}
          isDimmed={reaction === "not_today"}
          onPress={() => handleReact("resonates")}
        />
        <ReactionPill
          label="Not today"
          iosIcon="face.expressionless"
          androidIcon="sentiment_neutral"
          isSelected={reaction === "not_today"}
          isDimmed={reaction === "resonates"}
          onPress={() => handleReact("not_today")}
        />
      </View>
    </View>
  );
}

type ReactionPillProps = {
  label: string;
  iosIcon: string;
  androidIcon: string;
  isSelected: boolean;
  isDimmed: boolean;
  onPress: () => void;
};

function ReactionPill({
  label,
  iosIcon,
  androidIcon,
  isSelected,
  isDimmed,
  onPress,
}: ReactionPillProps) {
  const accentColor = useThemeColor("accent") as string;
  const foregroundColor = useThemeColor("foreground") as string;

  const iconColor = isSelected
    ? accentColor
    : isDimmed
      ? `${foregroundColor}33`
      : `${foregroundColor}99`;

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${isSelected ? ", selected" : ""}`}
      hitSlop={8}
    >
      <View
        className="flex-row items-center gap-2 rounded-full border px-4"
        style={{
          height: 44,
          borderColor: isSelected
            ? accentColor
            : isDimmed
              ? `${foregroundColor}15`
              : `${foregroundColor}20`,
        }}
      >
        <SymbolView
          name={{ ios: iosIcon as any, android: androidIcon as any }}
          size={16}
          tintColor={iconColor}
        />
        <AppText
          className="text-sm"
          style={{ color: isSelected ? accentColor : isDimmed ? `${foregroundColor}33` : `${foregroundColor}99` }}
        >
          {label}
        </AppText>
      </View>
    </PressableFeedback>
  );
}
