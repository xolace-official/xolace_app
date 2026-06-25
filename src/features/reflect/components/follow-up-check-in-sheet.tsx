import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, PressableFeedback } from "heroui-native";
import { Image } from "expo-image";
import { EaseView } from "react-native-ease/uniwind";

import { BottomSheetBlurOverlay } from "@/src/components/bottom-sheet-blur-overlay";
import { AppText } from "@/src/components/shared/app-text";
import { FeedbackSheet } from "@/src/features/session-end/components/feedback-sheet";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  chipsForTier,
  FOLLOW_UP_ACK,
  FOLLOW_UP_MASCOT_LABEL,
  FOLLOW_UP_RESOURCES_LABEL,
  type FollowUpResponse,
} from "@/src/features/reflect/follow-up-copy";

// Elevated/Standard pose. Acute reuses it for now — swap in a softer dedicated
// "presence" pose here when the asset exists (no orb/ember).
const MASCOT = require("@/assets/images/flux/flux-point-down-removebg-preview.png");

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const ACK_INITIAL = { opacity: 0 };
const ACK_ANIMATE = { opacity: 1 };
const ACK_TRANSITION = { type: "timing" as const, duration: 600, easing: EASING };

type Props = {
  card: Doc<"follow_up_cards"> | null;
  isOpen: boolean;
  onResolve: (response: FollowUpResponse) => void;
  onDismiss: () => void;
};

/**
 * The follow-up check-in sheet. Detached BottomSheet built to the
 * ReturnWelcomeSheet shape (blur backdrop, Flux pose, font-serif cardText,
 * EaseView entry). Responses are FeedbackSheet.Chips. Acute renders a
 * presence-first chip set + a quiet "resources are still here" link. Tapping a
 * chip resolves the card, plays a one-line acknowledgment, then closes; the
 * backdrop tap = a no-guilt dismiss.
 */
export const FollowUpCheckInSheet = ({
  card,
  isOpen,
  onResolve,
  onDismiss,
}: Props) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [phase, setPhase] = useState<"asking" | "ack">("asking");
  const [selected, setSelected] = useState<string | null>(null);
  // Once in the ack phase we keep the sheet open locally until the ack fade
  // completes, then release it (no setTimeout — driven by onTransitionEnd).
  const [released, setReleased] = useState(false);

  if (!card) return null;

  const showResources = card.tier === "acute" || card.escalationDerived;
  const effectiveOpen = (isOpen || phase === "ack") && !released;

  const handleChip = (key: string) => {
    const response = key as FollowUpResponse;
    setSelected(key);
    onResolve(response);
    // "Let it out" is a doorway into a fresh session — close straight away,
    // no acknowledgment. Other chips play the ack micro-state first.
    if (response === "vent") {
      setReleased(true);
      return;
    }
    setPhase("ack");
  };

  return (
    <BottomSheet
      isOpen={effectiveOpen}
      onOpenChange={(open) => {
        // Backdrop tap while still asking = a no-guilt dismiss.
        if (!open && phase === "asking") onDismiss();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          detached
          bottomInset={insets.bottom + 12}
          enableOverDrag={false}
          className="mx-4"
          backgroundClassName="rounded-[32px] bg-overlay"
          handleIndicatorClassName="opacity-0"
          accessibilityViewIsModal
        >
          {phase === "asking" ? (
            <View className="items-center px-6 pb-7 pt-1">
              <Image
                source={MASCOT}
                contentFit="contain"
                style={styles.mascot}
                accessibilityLabel={FOLLOW_UP_MASCOT_LABEL}
              />
              <BottomSheet.Title className="mt-1 text-center font-serif text-2xl leading-8 text-foreground">
                {card.cardText}
              </BottomSheet.Title>

              <View className="mt-6 w-full">
                <FeedbackSheet.Chips
                  chips={chipsForTier(card.tier)}
                  selected={selected}
                  onSelect={handleChip}
                />
              </View>

              {showResources && (
                <PressableFeedback
                  onPress={() => router.push("/crisis-resources")}
                  accessibilityRole="link"
                  accessibilityLabel={FOLLOW_UP_RESOURCES_LABEL}
                  hitSlop={12}
                  className="mt-5 min-h-11 items-center justify-center"
                >
                  <AppText className="text-sm text-warning/90 underline">
                    {FOLLOW_UP_RESOURCES_LABEL}
                  </AppText>
                </PressableFeedback>
              )}
            </View>
          ) : (
            <EaseView
              initialAnimate={ACK_INITIAL}
              animate={ACK_ANIMATE}
              transition={ACK_TRANSITION}
              onTransitionEnd={({ finished }) => {
                if (finished) setReleased(true);
              }}
            >
              <View className="items-center justify-center px-6 py-16">
                <AppText className="text-center font-serif text-xl text-foreground">
                  {FOLLOW_UP_ACK}
                </AppText>
              </View>
            </EaseView>
          )}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  mascot: { width: 170, height: 142 },
});
