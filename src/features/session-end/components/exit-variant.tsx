import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { useRouter } from "expo-router";
import { LinkButton } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { playSoftPress } from "@/src/lib/haptics";
import { NIGHT_SESSION_END_EXIT } from "@/src/features/reflect/night-copy";

type Props = {
  onHaveMore: () => void;
  isNight?: boolean;
};

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const INITIAL_FADE = { opacity: 0 };
const FADE_IN = { opacity: 1 };
const CONTENT_TRANSITION = {
  type: "timing",
  duration: 600,
  easing: EASE,
} as const;
const CTA_TRANSITION = {
  type: "timing",
  duration: 400,
  delay: 400,
  easing: EASE,
} as const;

export const ExitVariant = ({ onHaveMore, isNight = false }: Props) => {
  const router = useRouter();

  const handleTimelinePress = () => {
    playSoftPress();
    router.push("/(protected)/timeline");
  };

  return (
    <View className="flex-1 justify-center px-8">
      <EaseView
        initialAnimate={INITIAL_FADE}
        animate={FADE_IN}
        transition={CONTENT_TRANSITION}
      >
        <AppText className="mb-2 font-serif text-xl text-foreground">
          {isNight ? NIGHT_SESSION_END_EXIT : "Heard."}
        </AppText>
        <View className="mb-12 flex-row flex-wrap">
          <AppText className="text-base font-light leading-7 text-foreground/40">
            It&apos;s saved to{" "}
          </AppText>
          <LinkButton size="sm" onPress={handleTimelinePress}>
            <LinkButton.Label className="text-base font-light text-accent/60">
              your timeline
            </LinkButton.Label>
          </LinkButton>
          <AppText className="text-base font-light leading-7 text-foreground/40">
            {"\n"}whenever you want to come back to it.
          </AppText>
        </View>
      </EaseView>

      <EaseView
        initialAnimate={INITIAL_FADE}
        animate={FADE_IN}
        transition={CTA_TRANSITION}
      >
        <LinkButton onPress={onHaveMore} size="sm" className="self-start">
          <LinkButton.Label className="font-light text-accent/60">
            Have more? I&apos;m here.
          </LinkButton.Label>
        </LinkButton>
      </EaseView>
    </View>
  );
};
