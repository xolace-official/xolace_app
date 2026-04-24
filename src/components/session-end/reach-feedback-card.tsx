import { useState } from "react";
import { View, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/src/components/shared/app-text";

const MILESTONE_COUNTS = new Set([5, 15, 30]);

type LandedChoice = "felt_right" | "too_much" | "not_enough";

type Props = {
  sessionCount: number;
};

/**
 * Shown after milestone sessions (5, 15, 30) if the user has received
 * at least one delivered notification. Asks how the last notification landed.
 */
export const ReachFeedbackCard = ({ sessionCount }: Props) => {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const recordLanded = useMutation(api.notifications.recordLandedPublic);
  const lastDelivered = useQuery(api.notifications.lastDelivered);

  if (!MILESTONE_COUNTS.has(sessionCount)) return null;

  if (!lastDelivered) return null;

  // Don't show if this notification already has feedback
  if (lastDelivered.landed) return null;

  if (submitted) return null;

  const handleChoice = async (choice: LandedChoice) => {
    setError(false);
    try {
      await recordLanded({
        notificationId: lastDelivered._id as Id<"notification_log">,
        landed: choice,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to record notification feedback", err);
      setError(true);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
      <View className="mx-5 mt-6 p-4 rounded-2xl bg-surface border border-overlay/20">
        <AppText className="text-sm text-foreground/60 mb-2">
          When I reached out, what landed?
        </AppText>

        <View className="px-3 py-2.5 rounded-xl bg-background/60 mb-4">
          <AppText className="text-sm text-foreground/80 italic">
            &quot;{lastDelivered.content}&quot;
          </AppText>
        </View>

        <View className="flex-row gap-2">
          {(
            [
              { key: "felt_right", label: "Felt right" },
              { key: "too_much", label: "Too much" },
              { key: "not_enough", label: "Not enough" },
            ] as { key: LandedChoice; label: string }[]
          ).map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => handleChoice(key)}
              className="flex-1 py-2 rounded-xl bg-accent/10 items-center active:opacity-70"
            >
              <AppText className="text-xs font-medium text-accent">{label}</AppText>
            </Pressable>
          ))}
        </View>

        {error && (
          <AppText className="text-xs text-danger mt-3">
            Couldn&apos;t save that. Tap again to retry.
          </AppText>
        )}
      </View>
    </Animated.View>
  );
};
