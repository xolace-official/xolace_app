import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useState } from "react";
import { Tour } from "@/src/components/ui/tour";
import { IdleMenu } from "@/src/features/idle-menu/menu";
import { MicButton } from "@/src/features/reflect/components/mic-button";
import { ComposeChrome } from "@/src/features/reflect/compose/compose-chrome";
import { useMorphGeometry } from "@/src/features/reflect/compose/morph-geometry";
import { TextureBand } from "@/src/features/reflect/compose/texture-band";
import { TOUR_STEPS } from "@/src/features/reflect/tour-copy";
import type { QuietReturnTier } from "@/src/features/reflect/quiet-return-copy";
import type { ReflectionAction, UserVariant } from "@/src/features/reflect/types";

type Props = {
  progress: SharedValue<number>;
  /** The reduced-motion cross-fade's opacity. 1 whenever motion is allowed. */
  fade: SharedValue<number>;
  expanded: boolean;
  reduceMotion: boolean;
  variant: UserVariant;
  isNight: boolean;
  activeQuietReturn: QuietReturnTier | null;
  eventPrompt: string | null;
  eventLabel: string | null;
  spaceName?: string;
  selectedTextures: string[];
  dispatch: React.Dispatch<ReflectionAction>;
  onScaffoldSubmit: () => void;
  onVoiceTap: () => void;
  isRecording: boolean;
};

/**
 * The page the card rests on: identity strip above, chips below, mic beside.
 *
 * All of it recedes as the card takes the screen — it is one object growing,
 * not a page gaining a panel. `fade` carries the surround through the
 * reduced-motion cross-fade too, where progress jumps rather than travels and
 * would otherwise cut these out in a single frame.
 */
export const ComposeSurround = ({
  progress,
  fade,
  expanded,
  reduceMotion,
  variant,
  isNight,
  activeQuietReturn,
  eventPrompt,
  eventLabel,
  spaceName,
  selectedTextures,
  dispatch,
  onScaffoldSubmit,
  onVoiceTap,
  isRecording,
}: Props) => {
  const geo = useMorphGeometry();
  const rawHeaderHeight = useHeaderHeight();
  // Freeze the last known header height so it doesn't jump when the header
  // hides for the composer. Adjusting state during render (not in an effect) is
  // the supported pattern for retaining a value seen on a previous render.
  const [stableHeaderHeight, setStableHeaderHeight] = useState(0);
  if (rawHeaderHeight > 0 && rawHeaderHeight !== stableHeaderHeight) {
    setStableHeaderHeight(rawHeaderHeight);
  }

  const recede = useAnimatedStyle(() => ({
    opacity:
      fade.get() *
      interpolate(progress.get(), [0, 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  const bandStyle = useAnimatedStyle(() => ({
    opacity:
      fade.get() *
      interpolate(progress.get(), [0, 0.5], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : interpolate(progress.get(), [0, 0.6], [0, 40], Extrapolation.CLAMP),
      },
    ],
  }));

  const inFlow = expanded ? "none" : "auto";
  const overlay = expanded ? "none" : "box-none";
  const chromeStyle = {
    paddingTop: Math.max(0, stableHeaderHeight - geo.insetTop),
  };
  const micStyle = { top: geo.restTop + geo.restH + 20 };

  return (
    <>
      <Animated.View
        style={[chromeStyle, recede]}
        pointerEvents={inFlow}
        className="px-6 pt-4"
      >
        <ComposeChrome
          variant={variant}
          isNight={isNight}
          activeQuietReturn={activeQuietReturn}
          eventPrompt={eventPrompt}
          eventLabel={eventLabel}
          spaceName={spaceName}
        />
      </Animated.View>

      <View className="flex-1" />

      <Animated.View style={bandStyle} pointerEvents={inFlow}>
        <TextureBand
          isNight={isNight}
          selectedTextures={selectedTextures}
          dispatch={dispatch}
          onScaffoldSubmit={onScaffoldSubmit}
        />
      </Animated.View>

      {/* The mic stands outside the card at rest: the card is the page, the
          mic is something the user does. */}
      <Animated.View
        style={[{ position: "absolute", left: 0, right: 0 }, micStyle, recede]}
        pointerEvents={overlay}
        className="items-center"
      >
        <Tour.Step
          order={2}
          title={TOUR_STEPS[2].title}
          description={TOUR_STEPS[2].description}
          shape="circle"
          className="self-center"
        >
          <MicButton size="md" isRecording={isRecording} onPress={onVoiceTap} />
        </Tour.Step>
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, recede]}
        pointerEvents={overlay}
      >
        <IdleMenu />
      </Animated.View>
    </>
  );
};
