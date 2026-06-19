import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "../hooks/use-token-color";

type Props = {
  displayName: string;
  firstSessionAt: number | null;
  sessionCount: number;
};

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Morning, ${name}`;
  if (hour >= 12 && hour < 17) return `Afternoon, ${name}`;
  if (hour >= 17 && hour < 21) return `Evening, ${name}`;
  return `Quiet hours, ${name}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function formatSinceDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const month = MONTHS[d.getMonth()];
  return d.getFullYear() === now.getFullYear()
    ? `By the fire since ${month}`
    : `By the fire since ${month} ${d.getFullYear()}`;
}

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const INITIAL = { opacity: 0, translateY: 8 };
const ANIMATE = { opacity: 1, translateY: 0 };
const TRANSITION = { type: "timing" as const, duration: 320, easing: EASE };

export function ProfileHero({ displayName, firstSessionAt, sessionCount }: Props) {
  const emberColor = useTokenColor("ember");

  return (
    <View className="items-center px-6">
      <EaseView
        initialAnimate={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={TRANSITION}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: emberColor + "26",
            borderWidth: 1.5,
            borderColor: emberColor + "55",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SymbolView name="flame.fill" size={34} tintColor={emberColor} />
        </View>
      </EaseView>

      <EaseView
        initialAnimate={INITIAL}
        animate={ANIMATE}
        transition={{ ...TRANSITION, delay: 80 }}
        className="items-center gap-1.5 mt-4"
      >
        <AppText className="text-[27px] font-bold text-foreground tracking-tight text-center">
          {getGreeting(displayName)}
        </AppText>

        {sessionCount > 0 && firstSessionAt !== null && (
          <AppText className="text-[15px] text-muted">
            {formatSinceDate(firstSessionAt)}
          </AppText>
        )}

        {sessionCount === 0 && (
          <AppText className="text-[15px] text-muted text-center px-6 mt-1 leading-6">
            This is your space. It fills in as you show up.
          </AppText>
        )}
      </EaseView>
    </View>
  );
}
