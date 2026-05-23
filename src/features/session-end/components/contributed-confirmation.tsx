import { useEffect } from "react";
import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { Presets } from "react-native-pulsar";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/shared/pill-button";

type Props = {
  onDone: () => void;
};

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const FADE_IN = { opacity: 1 };
const INITIAL_FADE = { opacity: 0 };
const MESSAGE_TRANSITION = {
  type: "timing",
  duration: 600,
  easing: EASE,
} as const;
const BUTTON_TRANSITION = {
  type: "timing",
  duration: 400,
  delay: 600,
  easing: EASE,
} as const;

export const ContributedConfirmation = ({ onDone }: Props) => {
  useEffect(() => {
    Presets.dewdrop();
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-8">
      <EaseView
        initialAnimate={INITIAL_FADE}
        animate={FADE_IN}
        transition={MESSAGE_TRANSITION}
      >
        <AppText className="text-center font-serif text-lg leading-8 text-foreground">
          Someone out there{"\n"}will feel less alone{"\n"}because of what
          {"\n"}you shared.
        </AppText>
      </EaseView>

      <EaseView
        initialAnimate={INITIAL_FADE}
        animate={FADE_IN}
        transition={BUTTON_TRANSITION}
        className="mt-10"
      >
        <PillButton label="Done" onPress={onDone} />
      </EaseView>
    </View>
  );
};
