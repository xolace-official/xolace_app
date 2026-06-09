import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Presets } from "react-native-pulsar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { FeedbackSheet } from "@/src/features/session-end/components/feedback-sheet";

const CHIPS = [
  { key: "wrong_emotion", label: "Wrong emotion" },
  { key: "too_surface_level", label: "Too surface-level" },
  { key: "close_but_not_quite", label: "Close but not quite" },
  { key: "missed_the_main_thing", label: "Missed the main thing" },
] as const;

const SNAP_POINTS = ["44%"];

type Props = {
  sessionId: Id<"sessions"> | null;
  turnIndex: number;
  isOpen: boolean;
  onClose: () => void;
};

export function ClarifyFeedbackSheet({ sessionId, turnIndex, isOpen, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const submitFeedback = useMutation(api.feedback.submit);

  useEffect(() => {
    if (isOpen) setSubmitted(false);
  }, [isOpen]);

  const handleChip = (key: string) => {
    if (!submitted && sessionId) {
      Presets.chirp();
      setSubmitted(true);
      submitFeedback({
        type: "mirror_miss",
        sessionId,
        turnIndex,
        selectedOption: key,
      }).catch(() => {});
    }
    onClose();
  };

  return (
    <FeedbackSheet.Frame snapPoints={SNAP_POINTS} isOpen={isOpen} onClose={onClose}>
      <FeedbackSheet.Header subtitle="One tap — no pressure.">
        What didn&apos;t land?
      </FeedbackSheet.Header>
      <FeedbackSheet.Chips chips={CHIPS} selected={null} onSelect={handleChip} />
    </FeedbackSheet.Frame>
  );
}
