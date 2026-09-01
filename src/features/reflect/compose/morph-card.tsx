import type { RefObject } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, {
  Extrapolation,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { Presets } from "react-native-pulsar";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { playSoftPress } from "@/src/lib/haptics";
import { PresenceDot } from "@/src/features/reflect/components/presence-dot";
import { PillButton } from "@/src/components/shared/pill-button";
import { MicButton } from "@/src/features/reflect/components/mic-button";
import { Tour } from "@/src/components/ui/tour";
import { TOUR_STEPS } from "@/src/features/reflect/tour-copy";
import {
  CARD_PAD,
  HANDOFF,
  useMorphGeometry,
} from "@/src/features/reflect/compose/morph-geometry";
import type { CardContent } from "@/src/features/reflect/compose/resolve-card-content";

// Mirror of MAX_RAW_INPUT in convex/sessions.ts. The input simply stops
// accepting past this, so a user never hits the server's anti-tamper throw.
// No visible counter: a live count under an emotional freeform field reads as
// "your feelings must fit," and ~800 words is unreachable in normal use.
const MAX_RAW_INPUT = 5_000;

/** Prompt type scale, resting → composing, per card content scale. */
const PROMPT_SIZE = {
  large: [21, 14],
  small: [17, 13],
} as const;

type Props = {
  progress: SharedValue<number>;
  /** The reduced-motion cross-fade's opacity. 1 whenever motion is allowed. */
  fade: SharedValue<number>;
  expanded: boolean;
  card: CardContent;
  entryText: string;
  showNudge: boolean;
  nudgeMessage: string;
  isRecording: boolean;
  inputRef: RefObject<TextInput | null>;
  onOpen: () => void;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
  onVoiceTap: () => void;
};

/**
 * The card, at both of its sizes (#256).
 *
 * One object: at rest it is a tilted page holding the prompt, and tapping it
 * runs a single spring that rotates it upright and grows it from the header
 * down to the top of the keyboard, where it is the composer. Nothing mounts or
 * unmounts across that — `progress` is the only difference between the two
 * readings, which is what keeps it feeling like the page opened rather than
 * like a screen was replaced.
 *
 * The bottom edge tracks the keyboard's real animated height rather than a
 * guessed endpoint, so the card never grows under it.
 */
export const MorphCard = ({
  progress,
  fade,
  expanded,
  card,
  entryText,
  showNudge,
  nudgeMessage,
  isRecording,
  inputRef,
  onOpen,
  onChangeText,
  onSubmit,
  onDismiss,
  onVoiceTap,
}: Props) => {
  const geo = useMorphGeometry();
  const { height: kb } = useReanimatedKeyboardAnimation();
  const muted = useThemeColor("muted") as string;
  const [restSize, expandedSize] = PROMPT_SIZE[card.scale];

  const expH = useDerivedValue(() => {
    const kbH = -kb.get();
    const bottom =
      geo.H - geo.insetTop - (kbH > 0 ? kbH + 12 : geo.insetBottom + 16);
    return bottom - geo.expTop;
  });

  const cardStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: fade.get(),
      top: interpolate(p, [0, 1], [geo.restTop, geo.expTop]),
      left: interpolate(p, [0, 1], [geo.restLeft, geo.expLeft]),
      width: interpolate(p, [0, 1], [geo.restW, geo.expW]),
      height: interpolate(p, [0, 1], [geo.restH, expH.get()]),
      borderRadius: interpolate(p, [0, 1], [16, 32]),
      transform: [{ rotateZ: `${interpolate(p, [0, 1], [-4, 0])}deg` }],
    };
  });

  const promptStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(progress.get(), [0, 1], [restSize, expandedSize]),
    opacity: interpolate(progress.get(), [0, 1], [1, 0.45]),
  }));

  // The composer's controls arrive with the card, so it reads as one object
  // rather than as a page with parts assembled onto it.
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.get(),
      [HANDOFF, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.4, 1], [0, 1], Extrapolation.CLAMP),
  }));

  // Flux aims at the presence dot through CARD_PAD, so the padding is
  // geometry rather than a class the card can quietly restyle.
  const cardPadding = { padding: CARD_PAD };
  const canSubmit = entryText.trim().length > 0;
  const controlsPointerEvents = expanded ? "auto" : "none";

  return (
    <Animated.View
      style={[
        { position: "absolute", overflow: "hidden" },
        cardPadding,
        cardStyle,
      ]}
      className="border border-foreground/8 bg-surface shadow-lg"
    >
      <View className="flex-row items-center gap-2">
        <Animated.View style={controlsStyle}>
          <PresenceDot />
        </Animated.View>
        {/* The prompt is the card's own voice and stays visible while writing,
            so the tour's first step is about the line rather than the page. */}
        <Tour.Step
          order={0}
          title={TOUR_STEPS[0].title}
          description={TOUR_STEPS[0].description}
          className="flex-1"
        >
          <Animated.Text
            style={promptStyle}
            className="font-normal text-foreground"
          >
            {card.text}
          </Animated.Text>
        </Tour.Step>
        <Animated.View style={controlsStyle} pointerEvents={controlsPointerEvents}>
          <MicButton size="sm" isRecording={isRecording} onPress={onVoiceTap} />
        </Animated.View>
        <Animated.View style={controlsStyle} pointerEvents={controlsPointerEvents}>
          <Pressable
            onPress={() => {
              playSoftPress();
              onDismiss();
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close the composer"
            className="items-center justify-center rounded-full bg-foreground/8 p-1.5"
          >
            <AppText className="text-xs leading-none text-foreground/40">
              ✕
            </AppText>
          </Pressable>
        </Animated.View>
      </View>

      {showNudge && (
        <Animated.View
          entering={FadeInDown.springify().damping(20)}
          exiting={FadeOut.duration(200)}
          className="pt-2"
        >
          <AppText className="text-sm text-foreground/40">{nudgeMessage}</AppText>
        </Animated.View>
      )}

      <Animated.View
        style={[{ flex: 1 }, bodyStyle]}
        pointerEvents={controlsPointerEvents}
      >
        <TextInput
          ref={inputRef}
          multiline
          maxLength={MAX_RAW_INPUT}
          placeholder={isRecording ? "I'm listening..." : "Start typing..."}
          placeholderTextColor={muted}
          value={entryText}
          onChangeText={onChangeText}
          style={{ textAlignVertical: "top" }}
          className="flex-1 pt-4 text-lg text-foreground"
        />

        <View className="items-center pt-2">
          <PillButton
            label="Let it out"
            onPress={() => {
              Presets.propel();
              onSubmit();
            }}
            disabled={!canSubmit}
          />
        </View>
      </Animated.View>

      {!expanded && (
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel="Tap to begin writing"
          accessibilityHint="Opens the composer to start typing"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
    </Animated.View>
  );
};
