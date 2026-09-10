import { useEffect } from "react";
import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { LinkButton } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { isRateLimitMessage } from "@/src/features/reflect/session-service";
import { usePlusEntitlement } from "@/src/features/purchases/use-plus-entitlement";
import { usePaywall } from "@/src/features/purchases/use-paywall";
import { playErrorNotice } from "@/src/lib/haptics";

type Props = {
  errorMessage: string;
  onRetry: () => void;
  onReset: () => void;
};

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL = { opacity: 0, translateY: 20 };
const EASE_ANIMATE = { opacity: 1, translateY: 0 };
const EASE_UPGRADE = {
  type: "timing" as const,
  duration: 400,
  delay: 200,
  easing: EASING,
};
const EASE_RETRY = {
  type: "timing" as const,
  duration: 400,
  delay: 300,
  easing: EASING,
};
const EASE_RESET = {
  type: "timing" as const,
  duration: 400,
  delay: 400,
  easing: EASING,
};

export const ErrorState = ({ errorMessage, onRetry, onReset }: Props) => {
  const { isPlus } = usePlusEntitlement();
  const openPaywall = usePaywall((s) => s.open);
  // The hourly cap is the free/Plus gate — the one place the ceiling is
  // unmissable — so free users get the door instead of a dead end.
  const showUpgrade = !isPlus && isRateLimitMessage(errorMessage);

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

      {showUpgrade ? (
        <AppText className="mt-3 text-base leading-6 text-foreground/40">
          Xolace+ raises the hourly limit.
        </AppText>
      ) : null}

      <View className="mt-14 gap-6">
        {showUpgrade ? (
          <EaseView
            initialAnimate={EASE_INITIAL}
            animate={EASE_ANIMATE}
            transition={EASE_UPGRADE}
          >
            <LinkButton
              accessibilityLabel="See Xolace Plus"
              onPress={() => openPaywall("rate_limit")}
              size="md"
              className="self-start"
            >
              <LinkButton.Label className="font-semibold text-accent">
                See Xolace+
              </LinkButton.Label>
            </LinkButton>
          </EaseView>
        ) : null}

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
            <LinkButton.Label
              className={
                showUpgrade
                  ? "text-foreground/55"
                  : "font-semibold text-accent"
              }
            >
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
            <LinkButton.Label className="text-foreground/55">
              Start fresh
            </LinkButton.Label>
          </LinkButton>
        </EaseView>
      </View>
    </View>
  );
};
