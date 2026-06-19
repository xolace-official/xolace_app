import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { CampfireArc } from "./campfire-arc";

type Props = {
  displayName: string;
  firstSessionAt: number | null;
  sessionCount: number;
};

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return `Morning, ${name}`;
  if (hour >= 8 && hour < 12) return `Morning, ${name}`;
  if (hour >= 12 && hour < 17) return `Afternoon, ${name}`;
  if (hour >= 17 && hour < 21) return `Evening, ${name}`;
  return `Quiet hours, ${name}`;
}

function formatSinceDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  return d.getFullYear() === now.getFullYear()
    ? `By the fire since ${month}`
    : `By the fire since ${month} '${String(d.getFullYear()).slice(2)}`;
}

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const INITIAL = { opacity: 0, translateY: 8 };
const ANIMATE = { opacity: 1, translateY: 0 };
const TRANSITION = { type: "timing" as const, duration: 280, easing: EASE };

export function ProfileHero({ displayName, firstSessionAt, sessionCount }: Props) {
  const emberColor = useThemeColor("ember") as string;

  const TotemPlaceholder = (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: emberColor + "22",
        borderWidth: 1.5,
        borderColor: emberColor + "55",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SymbolView name="flame.fill" size={24} tintColor={emberColor} />
    </View>
  );

  return (
    <View className="items-center">
      <CampfireArc>{TotemPlaceholder}</CampfireArc>

      <EaseView
        initialAnimate={INITIAL}
        animate={ANIMATE}
        transition={{ ...TRANSITION, delay: 60 }}
        className="items-center gap-1 mt-2"
      >
        <AppText className="text-2xl font-bold text-foreground tracking-tight">
          {getGreeting(displayName)}
        </AppText>

        {sessionCount > 0 && firstSessionAt !== null && (
          <AppText className="text-sm text-muted">
            {formatSinceDate(firstSessionAt)}
          </AppText>
        )}

        {sessionCount === 0 && (
          <AppText className="text-sm text-muted text-center px-8 mt-1 leading-5">
            This is your space. It fills in as you show up.
          </AppText>
        )}
      </EaseView>
    </View>
  );
}
