import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useThemeColor } from "heroui-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AppText } from "@/src/components/shared/app-text";
import { BreathingOrb } from "@/src/features/reflect/components/breathing-orb";
import Shimmer from "@/src/components/shared/shimmer";
import { SparkleStars } from "@/src/components/shared/sparkle-stars";
import { playProcessingBreath } from "@/src/lib/haptics";

const PHRASES = [
  "Taking this in...",
  "Sitting with what you shared...",
  "Finding the words...",
  "Feeling into this...",
  "Sensing what's here...",
];

const PHRASE_DURATION_MS = 2500;
const FADE_DURATION_MS = 400;

const SHIMMER_CONTAINER_STYLE = {
  overflow: "hidden",
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 6,
} as const;

const SHIMMER_OVERLAY_INNER_STYLE = {
  flex: 1,
  opacity: 0.15,
} as const;

export const ProcessingState = () => {
  const accentColor = useThemeColor("accent");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const opacity = useSharedValue(1);
  const phraseIndexSV = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    playProcessingBreath();
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Fade out
      opacity.value = withTiming(
        0,
        { duration: FADE_DURATION_MS, easing: Easing.out(Easing.ease) },
        (finished) => {
          "worklet";
          if (!finished) return;
          // Compute next index on UI thread, schedule React state update on JS thread
          const nextIndex = (phraseIndexSV.value + 1) % PHRASES.length;
          phraseIndexSV.value = nextIndex;
          scheduleOnRN(setPhraseIndex, nextIndex);
          opacity.value = withTiming(1, {
            duration: FADE_DURATION_MS,
            easing: Easing.in(Easing.ease),
          });
        },
      );
    }, PHRASE_DURATION_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [opacity, phraseIndexSV]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shimmerOverlayStyle = {
    ...SHIMMER_OVERLAY_INNER_STYLE,
    backgroundColor: accentColor,
  };

  return (
    <View className="flex-1 items-center justify-center gap-8">
      <BreathingOrb />
      <View className="items-center">
        <Shimmer style={SHIMMER_CONTAINER_STYLE}>
          <Shimmer.Overlay
            width="40%"
            duration={2000}
            repeatDelay={800}
            trackAngle={0}
          >
            <View style={shimmerOverlayStyle} />
          </Shimmer.Overlay>
          <Animated.View style={animatedStyle}>
            <AppText className="text-sm text-foreground/40">
              {PHRASES[phraseIndex]}
            </AppText>
          </Animated.View>
        </Shimmer>
        <SparkleStars color={accentColor} />
      </View>
    </View>
  );
};
