import { useState } from "react";
import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import type { TransitionEndEvent } from "react-native-ease";
import { PressableFeedback } from "heroui-native";
import { useMutation } from "convex/react";
import { Presets } from "react-native-pulsar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/src/components/shared/app-text";

const CHIPS = [
  { key: "wrong_emotion", label: "Wrong emotion" },
  { key: "too_surface_level", label: "Too surface-level" },
  { key: "close_but_not_quite", label: "Close but not quite" },
  { key: "missed_the_main_thing", label: "Missed the main thing" },
] as const;

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

type Props = {
  sessionId: Id<"sessions"> | null;
  turnIndex: number;
};

export function ClarifyFeedbackCard({ sessionId, turnIndex }: Props) {
  const [mounted, setMounted] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = useMutation(api.feedback.submit);

  if (!mounted) return null;

  const handleChip = async (key: string) => {
    if (submitted || !sessionId) return;
    Presets.chirp();
    setSubmitted(true);
    setExiting(true);
    // fire-and-forget — don't await, don't block UI
    submitFeedback({
      type: "mirror_miss",
      sessionId,
      turnIndex,
      selectedOption: key,
    }).catch(() => {
      // silent — this is non-critical feedback
    });
  };

  const handleTransitionEnd = ({ finished }: TransitionEndEvent) => {
    if (finished) setMounted(false);
  };

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: exiting ? 0 : 1, translateY: exiting ? -6 : 0 }}
      transition={{
        type: "timing",
        duration: exiting ? 220 : 380,
        easing: EASING,
      }}
      onTransitionEnd={exiting ? handleTransitionEnd : undefined}
      className="mx-1"
    >
      <View className="p-4 rounded-2xl bg-surface/50 border border-overlay/20">
        <AppText className="text-xs font-light text-foreground/40 mb-3">
          Did the mirror miss?
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          {CHIPS.map(({ key, label }) => (
            <PressableFeedback
              key={key}
              onPress={() => handleChip(key)}
              accessibilityRole="button"
              accessibilityLabel={label}
              isDisabled={submitted}
              className="py-2 px-3 rounded-xl bg-overlay/30 border border-overlay/20"
            >
              <AppText className="text-xs font-light text-foreground/50">{label}</AppText>
            </PressableFeedback>
          ))}
        </View>
      </View>
    </EaseView>
  );
}
