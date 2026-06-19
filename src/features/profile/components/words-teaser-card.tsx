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
      className="mx-5"
    >
      <View className="rounded-3xl bg-surface border border-border/60 overflow-hidden">
        {/* Header row */}
        <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
          <View className="flex-row items-center gap-2">
            <SymbolView name="lock.fill" size={11} tintColor={mutedHex + "99"} />
            <AppText className="text-[11px] font-medium text-muted tracking-widest uppercase">
              Words that keep finding you
            </AppText>
          </View>
        </View>

        {/* Words list — real words visible, counts blurred */}
        <View className="px-5 pb-5 gap-2.5">
          {displayWords.map((word, i) => (
            <View key={word} className="flex-row items-center justify-between">
              <AppText
                className="text-sm"
                style={{ color: accentHex + "CC" }}
              >
                {word}
              </AppText>

              {/* Frosted count — users can see there's data, not what it is */}
              <View
                className="rounded-lg overflow-hidden items-center justify-center"
                style={{
                  width: 42,
                  height: 24,
                  borderWidth: 1,
                  borderColor: mutedHex + "1F",
                }}
              >
                <AppText className="text-[11px] tracking-widest" style={{ color: mutedHex + "66" }}>
                  {PLACEHOLDER_COUNTS[i % PLACEHOLDER_COUNTS.length]}
                </AppText>
                <BlurView intensity={14} tint="default" className="absolute inset-0" />
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: accentHex + "10" }}
                >
                  <SymbolView name="lock.fill" size={9} tintColor={mutedHex + "99"} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </EaseView>
  );
}
