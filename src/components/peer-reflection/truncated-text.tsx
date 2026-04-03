import { useState } from "react";
import { Pressable, type NativeSyntheticEvent, type TextLayoutEventData } from "react-native";
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

  const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    // Detect if the text was actually truncated
    if (!expanded && e.nativeEvent.lines.length >= MAX_LINES) {
      setClipped(true);
    }
  };

  return (
    <Animated.View layout={LinearTransition.springify().damping(18).stiffness(120)}>
      <Pressable onPress={clipped ? () => setExpanded((v) => !v) : undefined}>
        <AppText
          className={className}
          numberOfLines={expanded ? undefined : MAX_LINES}
          onTextLayout={handleTextLayout}
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
