import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
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

type SFSymbol = React.ComponentProps<typeof SymbolView>["name"];

function moodRow(delta: MoodDelta): { icon: SFSymbol; text: string } | null {
  switch (delta) {
    case "lighter": return { icon: "arrow.up.circle", text: "Most of your sessions end lighter." };
    case "same": return { icon: "circle.lefthalf.filled", text: "You tend to leave feeling much the same." };
    case "heavier": return { icon: "arrow.down.circle", text: "Some sessions surface things that feel heavier at close." };
    case "unsure": return { icon: "questionmark.circle", text: "You often sit with uncertainty after." };
    case "mixed": return { icon: "circle.dotted", text: "Sessions land differently each time — that's honest." };
    default: return null;
  }
}

function rhythmRow(pattern: TypicalPattern): { icon: SFSymbol; text: string } | null {
  if (!pattern) return null;
  const day = DAYS[pattern.dayOfWeek];
  const h = pattern.hourOfDay;
  let period: string;
  let icon: SFSymbol;
  if (h >= 5 && h < 12) { period = "mornings"; icon = "sunrise"; }
  else if (h >= 12 && h < 17) { period = "afternoons"; icon = "sun.max"; }
  else if (h >= 17 && h < 21) { period = "evenings"; icon = "sunset"; }
  else { period = "late nights"; icon = "moon.stars"; }
  return { icon, text: `You arrive most on ${day} ${period}.` };
}

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

export function MirrorLines({ moodDelta, typicalPattern, staggerDelay = 240 }: Props) {
  const accent = useThemeColor("accent") as string;
  const rows = [moodRow(moodDelta), rhythmRow(typicalPattern)].filter(Boolean) as {
    icon: SFSymbol;
    text: string;
  }[];

  if (rows.length === 0) return null;

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300, easing: EASE, delay: staggerDelay }}
      className="px-5 mt-8"
    >
      <AppText className="text-[11px] text-muted mb-3.5 tracking-widest uppercase">
        your patterns
      </AppText>
      <View className="rounded-3xl bg-surface border border-border/60 px-4">
        {rows.map((row, i) => (
          <View
            key={row.text}
            className={`flex-row items-center gap-3.5 py-4 ${i > 0 ? "border-t border-border/50" : ""}`}
          >
            <View
              className="items-center justify-center rounded-2xl w-9 h-9"
              style={{ backgroundColor: accent + "22" }}
            >
              <SymbolView name={row.icon} size={18} tintColor={accent} />
            </View>
            <AppText className="flex-1 text-[15px] text-foreground/90 leading-5">
              {row.text}
            </AppText>
          </View>
        ))}
      </View>
    </EaseView>
  );
}
