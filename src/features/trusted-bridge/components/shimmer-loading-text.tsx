import { useEffect, useState } from "react";
import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";

const LINES = [
  (name: string) => `Finding the words for ${name}…`,
  () => "Turning what you felt into something you can say…",
  (name: string) => `Shaping this for ${name}…`,
  () => "Looking for how to begin…",
];

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const FADE_IN = { opacity: 1 };
const FADE_OUT = { opacity: 0 };
const TRANSITION = { type: "timing" as const, duration: 500, easing: EASING };

type Props = {
  name: string;
};

export function ShimmerLoadingText({ name }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % LINES.length),
      2500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <View className="items-center px-8">
      <EaseView
        key={idx}
        initialAnimate={FADE_OUT}
        animate={FADE_IN}
        transition={TRANSITION}
      >
        <AppText className="text-lg font-light text-foreground/50 text-center leading-7">
          {LINES[idx](name)}
        </AppText>
      </EaseView>
    </View>
  );
}
