import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  sessionCount: number;
  currentStreak: number;
  staggerDelay?: number;
};

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

export function PulseRow({ sessionCount, currentStreak, staggerDelay = 120 }: Props) {
  const parts: string[] = [];
  parts.push(`${sessionCount} ${sessionCount === 1 ? "moment" : "moments"}`);
  if (currentStreak > 0) parts.push(`Day ${currentStreak}`);

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280, easing: EASE, delay: staggerDelay }}
    >
      <View className="flex-row items-center justify-center gap-3 mt-4">
        {parts.map((part, i) => (
          <View key={part} className="flex-row items-center gap-3">
            {i > 0 && (
              <View className="w-px h-3 bg-border" />
            )}
            <AppText className="text-sm text-foreground/70">{part}</AppText>
          </View>
        ))}
      </View>
    </EaseView>
  );
}
