import { View } from "react-native";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  words: string[];
  staggerDelay?: number;
};

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

// Placeholder counts behind the blur — just needs to be vaguely word-shaped
const PLACEHOLDER_COUNTS = ["··", "···", "·"];

export function WordsTeaserCard({ words, staggerDelay = 360 }: Props) {
  const mutedHex = useThemeColor("muted") as string;
  const accentHex = useThemeColor("accent") as string;

  const displayWords = words.length > 0 ? words.slice(0, 3) : ["still", "here", "quiet"];

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280, easing: EASE, delay: staggerDelay }}
      className="mx-4"
    >
      <View className="rounded-2xl bg-surface border border-border/40 overflow-hidden">
        {/* Header row */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
          <View className="flex-row items-center gap-1.5">
            <SymbolView name="lock.fill" size={10} tintColor={mutedHex + "88"} />
            <AppText className="text-xs font-medium text-foreground/50 tracking-wide">
              Words that keep finding you
            </AppText>
          </View>
        </View>

        {/* Words list — real words visible, counts blurred */}
        <View className="px-4 pb-4 gap-2">
          {displayWords.map((word, i) => (
            <View key={word} className="flex-row items-center justify-between">
              <AppText
                className="text-sm"
                style={{ color: accentHex + "CC" }}
              >
                {word}
              </AppText>

              {/* Blurred count — users can see there's data, not what it is */}
              <View
                className="rounded-md overflow-hidden"
                style={{ width: 36, height: 20 }}
              >
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: mutedHex + "18" }}
                >
                  <AppText className="text-xs text-muted">
                    {PLACEHOLDER_COUNTS[i % PLACEHOLDER_COUNTS.length]}
                  </AppText>
                </View>
                <BlurView
                  intensity={68}
                  tint="default"
                  className="absolute inset-0"
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </EaseView>
  );
}
