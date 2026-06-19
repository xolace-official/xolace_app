import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";

type MoodDelta = "lighter" | "same" | "heavier" | "unsure" | "mixed" | null;

type TypicalPattern = { dayOfWeek: number; hourOfDay: number } | null;

type Props = {
  moodDelta: MoodDelta;
  typicalPattern: TypicalPattern;
  staggerDelay?: number;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function moodLine(delta: MoodDelta): string | null {
  switch (delta) {
    case "lighter": return "Most of your sessions end lighter.";
    case "same": return "You tend to leave feeling much the same.";
    case "heavier": return "Some sessions surface things that feel heavier at close.";
    case "unsure": return "You often sit with uncertainty after.";
    case "mixed": return "Sessions land differently each time — that's honest.";
    default: return null;
  }
}

function rhythmLine(pattern: TypicalPattern): string | null {
  if (!pattern) return null;
  const day = DAYS[pattern.dayOfWeek];
  const h = pattern.hourOfDay;
  let period: string;
  if (h >= 5 && h < 12) period = "mornings";
  else if (h >= 12 && h < 17) period = "afternoons";
  else if (h >= 17 && h < 21) period = "evenings";
  else period = "late nights";
  return `You tend to arrive on ${day} ${period}.`;
}

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

export function MirrorLines({ moodDelta, typicalPattern, staggerDelay = 240 }: Props) {
  const f4 = moodLine(moodDelta);
  const f5 = rhythmLine(typicalPattern);

  if (!f4 && !f5) return null;

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280, easing: EASE, delay: staggerDelay }}
    >
      <View className="mt-5 px-6 gap-1">
        {f4 && (
          <AppText className="text-sm text-muted leading-5">{f4}</AppText>
        )}
        {f5 && (
          <AppText className="text-sm text-muted leading-5">{f5}</AppText>
        )}
      </View>
    </EaseView>
  );
}
