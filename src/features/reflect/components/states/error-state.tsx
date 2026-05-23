import { useEffect } from "react";
import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { LinkButton } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { playErrorNotice } from "@/src/lib/haptics";

type Props = {
  errorMessage: string;
  onRetry: () => void;
  onReset: () => void;
};

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL = { opacity: 0, translateY: 20 };
const EASE_ANIMATE = { opacity: 1, translateY: 0 };
const EASE_RETRY = {
  type: "timing" as const,
  duration: 400,
  delay: 200,
  easing: EASING,
};
const EASE_RESET = {
  type: "timing" as const,
  duration: 400,
  delay: 400,
  easing: EASING,
};

export const ErrorState = ({ errorMessage, onRetry, onReset }: Props) => {
  useEffect(() => {
    playErrorNotice();
  }, []);

  return (
    <View className="flex-1 justify-center px-6">
      <AppText className="text-xl leading-8 text-foreground">
        Take a breath.
      </AppText>

      <AppText className="mt-4 text-base leading-6 text-foreground/40">
        {errorMessage}
      </AppText>

      <View className="mt-14 gap-6">
        <EaseView
          initialAnimate={EASE_INITIAL}
          animate={EASE_ANIMATE}
          transition={EASE_RETRY}
        >
          <LinkButton
            accessibilityLabel="Try again"
            onPress={onRetry}
            size="md"
            className="self-start"
          >
            <LinkButton.Label className="font-semibold text-accent">
              Try again
            </LinkButton.Label>
          </LinkButton>
        </EaseView>

        <EaseView
          initialAnimate={EASE_INITIAL}
          animate={EASE_ANIMATE}
          transition={EASE_RESET}
        >
          <LinkButton
            accessibilityLabel="Start fresh"
            onPress={onReset}
            size="md"
            className="self-start"
          >
            <LinkButton.Label className="text-foreground/50">
              Start fresh
            </LinkButton.Label>
          </LinkButton>
        </EaseView>
      </View>
    </View>
  );
};
