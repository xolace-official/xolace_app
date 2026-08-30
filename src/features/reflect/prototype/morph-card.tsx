// PROTOTYPE — motion only. Hard-coded prompt, no reducer wiring. See issue #246.
import { useEffect } from "react";
import { Pressable, TextInput, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";

const FLUX = require("@/assets/images/flux/flux-whisper.png");
const PROMPT = "What's sitting with you right now?";
const FLUX_SIZE = 104;
const DOT = 12;

type Props = {
  progress: SharedValue<number>;
  fade: SharedValue<number>;
  reduceMotion: boolean;
  expanded: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const MorphCard = ({
  progress,
  fade,
  reduceMotion,
  expanded,
  onOpen,
  onClose,
}: Props) => {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { height: kb } = useReanimatedKeyboardAnimation();
  const accent = useThemeColor("accent") as string;
  const breath = useSharedValue(0);

  const restH = H / 2.8;
  const restW = restH * 0.75;
  const restLeft = (W - restW) / 2;
  const restTop = H * 0.32;
  const expLeft = 16;
  const expTop = insets.top + 8;

  useEffect(() => {
    if (reduceMotion) return;
    breath.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [breath, reduceMotion]);

  // Keyboard-tracked bottom edge: the card grows only to the top of the keyboard.
  const expH = useDerivedValue(() => {
    const kbH = -kb.get();
    const bottom = H - (kbH > 0 ? kbH + 12 : insets.bottom + 16);
    return bottom - expTop;
  });

  const cardStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: fade.get(),
      top: interpolate(p, [0, 1], [restTop, expTop]),
      left: interpolate(p, [0, 1], [restLeft, expLeft]),
      width: interpolate(p, [0, 1], [restW, W - expLeft * 2]),
      height: interpolate(p, [0, 1], [restH, expH.get()]),
      borderRadius: interpolate(p, [0, 1], [16, 32]),
      transform: [{ rotateZ: `${interpolate(p, [0, 1], [-4, 0])}deg` }],
    };
  });

  const promptStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(progress.get(), [0, 1], [21, 14]),
    opacity: interpolate(progress.get(), [0, 1], [1, 0.45]),
  }));

  // Flux travels into the composer's presence dot as the card takes over.
  const fluxStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const b = reduceMotion ? 0 : breath.get();
    return {
      opacity: interpolate(p, [0, 0.55], [1, 0]),
      transform: [
        {
          translateX: interpolate(p, [0, 1], [0, expLeft + 20 - restLeft + 8]),
        },
        {
          translateY: interpolate(
            p,
            [0, 1],
            [0, expTop + 26 - (restTop - FLUX_SIZE - 12)],
          ),
        },
        { scale: interpolate(p, [0, 1], [1 + b * 0.02, DOT / FLUX_SIZE]) },
        { translateY: b * -3 },
      ],
    };
  });

  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.55, 1], [0, 1]),
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.4, 1], [0, 1]),
  }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: restLeft + 8,
            top: restTop - FLUX_SIZE - 12,
            width: FLUX_SIZE,
            height: FLUX_SIZE,
          },
          fluxStyle,
        ]}
      >
        <Image
          source={FLUX}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          { position: "absolute", overflow: "hidden" },
          cardStyle,
        ]}
        className="border border-foreground/8 bg-surface p-5 shadow-lg"
      >
        <View className="flex-row items-center gap-2">
          <Animated.View
            style={[{ width: DOT, height: DOT, backgroundColor: accent }, dotStyle]}
            className="rounded-full"
          />
          <Animated.Text style={promptStyle} className="flex-1 font-normal text-foreground">
            {PROMPT}
          </Animated.Text>
          <Animated.View style={dotStyle}>
            <Pressable onPress={onClose} hitSlop={12} className="rounded-full bg-foreground/8 p-1.5">
              <AppText className="text-xs leading-none text-foreground/40">✕</AppText>
            </Pressable>
          </Animated.View>
        </View>

        <Animated.View style={[{ flex: 1 }, bodyStyle]} pointerEvents={expanded ? "auto" : "none"}>
          <TextInput
            autoFocus={expanded}
            multiline
            placeholder="Start typing..."
            className="flex-1 pt-4 text-lg text-foreground"
            style={{ textAlignVertical: "top" }}
          />
        </Animated.View>

        {!expanded && (
          <Pressable
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel="Tap to begin writing"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}
      </Animated.View>
    </>
  );
};
