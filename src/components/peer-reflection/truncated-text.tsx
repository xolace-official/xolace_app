import { useState } from "react";
import { Pressable, View, type NativeSyntheticEvent, type TextLayoutEventData } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { AppText } from "@/src/components/shared/app-text";

const MAX_LINES = 4;

type Props = {
  text: string;
  className?: string;
};

export const TruncatedText = ({ text, className }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);

  // Measure the full (uncapped) line count to know if truncation is actually needed.
  // onTextLayout on the visible text fires with lines capped at numberOfLines,
  // so a 4-line text that fits perfectly would incorrectly appear "clipped".
  const handleFullTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    setClipped(e.nativeEvent.lines.length > MAX_LINES);
  };

  return (
    <Animated.View layout={LinearTransition.springify().damping(18).stiffness(120)}>
      {/* Hidden render with no line cap to get the true line count */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }}
      >
        <AppText
          className={className}
          numberOfLines={undefined}
          onTextLayout={handleFullTextLayout}
        >
          &ldquo;{text}&rdquo;
        </AppText>
      </View>

      <Pressable onPress={clipped ? () => setExpanded((v) => !v) : undefined}>
        <AppText
          className={className}
          numberOfLines={expanded ? undefined : MAX_LINES}
        >
          &ldquo;{text}&rdquo;
        </AppText>

        {clipped && !expanded && (
          <AppText className="text-sm text-foreground/30 mt-1">read more</AppText>
        )}
        {clipped && expanded && (
          <AppText className="text-sm text-foreground/30 mt-1">show less</AppText>
        )}
      </Pressable>
    </Animated.View>
  );
};
