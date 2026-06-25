import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, PressableFeedback, useThemeColor } from "heroui-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
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
  VENT_A11Y_LABEL,
  VENT_LABEL,
  VENT_SUBLABEL,
  type FollowUpResponse,
} from "@/src/features/reflect/follow-up-copy";

// Elevated/Standard pose. Acute reuses it for now — swap in a softer dedicated
// "presence" pose here when the asset exists (no orb/ember).
const MASCOT = require("@/assets/images/flux/flux-point-down-removebg-preview.png");

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
// The ack is a real beat, not a flicker: fade in, hold (delay), fade out, then
// release the sheet. Driven by two onTransitionEnd hops — no setTimeout.
const ACK_IN_INITIAL = { opacity: 0 };
const ACK_IN_ANIMATE = { opacity: 1 };
const ACK_IN_TRANSITION = { type: "timing" as const, duration: 420, easing: EASING };
const ACK_OUT_ANIMATE = { opacity: 0 };
const ACK_OUT_TRANSITION = {
  type: "timing" as const,
  duration: 460,
  easing: EASING,
  delay: 1150,
};

const MIC_ICON = { ios: "mic", android: "mic" } as const;
const CHEVRON_ICON = { ios: "chevron.right", android: "chevron_right" } as const;

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
  const accentColor = useThemeColor("accent") as string;
  const mutedColor = useThemeColor("muted") as string;
  const [phase, setPhase] = useState<"asking" | "ack">("asking");
  // Ack sub-stage: "in" fades the ack up, "out" holds then fades it down and
  // releases the sheet on completion.
  const [ackStage, setAckStage] = useState<"in" | "out">("in");
  const [selected, setSelected] = useState<string | null>(null);
  // Once in the ack phase we keep the sheet open locally until the ack fade-out
  // completes, then release it (no setTimeout — driven by onTransitionEnd).
  const [released, setReleased] = useState(false);

  // The sheet stays mounted across cards (so the BottomSheet gets a clean
  // false→true open transition), so per-card local state must be reset when a
  // new card surfaces — otherwise a prior resolution's `released` flag would
  // permanently suppress the next check-in. Render-time reset (React's
  // "adjust state on prop change" pattern), not an effect.
  const cardId = card?._id ?? null;
  const [prevCardId, setPrevCardId] = useState(cardId);
  if (cardId !== prevCardId) {
    setPrevCardId(cardId);
    setReleased(false);
    setPhase("asking");
    setAckStage("in");
    setSelected(null);
  }

  const showResources = !!card && (card.tier === "acute" || card.escalationDerived);
  const effectiveOpen = !!card && (isOpen || phase === "ack") && !released;

  // Status chips play the ack micro-state first; the sheet releases after it.
  const handleChip = (key: string) => {
    setSelected(key);
    onResolve(key as FollowUpResponse);
    setAckStage("in");
    setPhase("ack");
  };

  // "Let it out" is a different kind of action — the doorway into the voice-vent
  // flow. Resolve the card, close immediately, open the vent screen. No ack.
  const handleVent = () => {
    onResolve("vent");
    setReleased(true);
    router.push("/(protected)/voice-vent");
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
          {card == null ? null : phase === "asking" ? (
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

              {/* A different kind of action, set apart from the status chips:
                  a doorway out to the voice-vent screen. Hairline divider +
                  whitespace + accent treatment + icon = clear separation. */}
              <View className="mt-5 h-px w-full bg-border/45" />
              <PressableFeedback
                onPress={handleVent}
                accessibilityRole="button"
                accessibilityLabel={VENT_A11Y_LABEL}
                className="mt-5 w-full flex-row items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3.5"
              >
                <View className="flex-row items-center gap-3">
                  <SymbolView
                    name={MIC_ICON as any}
                    size={20}
                    tintColor={accentColor}
                  />
                  <View>
                    <AppText className="text-sm font-medium text-accent">
                      {VENT_LABEL}
                    </AppText>
                    <AppText className="text-xs font-light text-foreground/45">
                      {VENT_SUBLABEL}
                    </AppText>
                  </View>
                </View>
                <SymbolView
                  name={CHEVRON_ICON as any}
                  size={14}
                  tintColor={mutedColor}
                />
              </PressableFeedback>

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
              initialAnimate={ACK_IN_INITIAL}
              animate={ackStage === "in" ? ACK_IN_ANIMATE : ACK_OUT_ANIMATE}
              transition={ackStage === "in" ? ACK_IN_TRANSITION : ACK_OUT_TRANSITION}
              onTransitionEnd={({ finished }) => {
                if (!finished) return;
                // Fade-in done → hold + fade out; fade-out done → release.
                if (ackStage === "in") setAckStage("out");
                else setReleased(true);
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
