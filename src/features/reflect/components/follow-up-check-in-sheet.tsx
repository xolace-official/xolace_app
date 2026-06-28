import { useReducer } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";
import { BottomSheet, PressableFeedback, useThemeColor } from "heroui-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";

import { BottomSheetBlurOverlay } from "@/src/components/bottom-sheet-blur-overlay";
import { AppText } from "@/src/components/shared/app-text";
import { FeedbackSheet } from "@/src/features/session-end/components/feedback-sheet";
import {
  followUpReducer,
  initFollowUpState,
} from "@/src/features/reflect/components/follow-up-check-in-reducer";
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
const ACK_IN_TRANSITION = {
  type: "timing" as const,
  duration: 420,
  easing: EASING,
};
const ACK_OUT_ANIMATE = { opacity: 0 };
const ACK_OUT_TRANSITION = {
  type: "timing" as const,
  duration: 460,
  easing: EASING,
  delay: 1150,
};

const MIC_ICON = { ios: "mic", android: "mic" } as const;
const CHEVRON_ICON = {
  ios: "chevron.right",
  android: "chevron_right",
} as const;

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
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const accentColor = useThemeColor("accent") as string;
  const mutedColor = useThemeColor("muted") as string;
  // Cap the detached sheet so it never runs past the safe area on small
  // devices; the content scrolls inside once it exceeds this. Above this it
  // still hugs its content (dynamic sizing).
  const maxSheetContent = windowHeight - insets.top - insets.bottom - 32;

  // The sheet runs a small state machine (snapshot card + ack animation phases).
  // Tapping a chip resolves the card server-side, so the live `card` prop drops
  // to null on the next query tick — which would yank the whole sheet shut
  // before the ack can play. To keep the sheet up through the ack, we snapshot
  // the card locally and render from the snapshot, driving open/close from this
  // machine instead of the live query. A genuinely new card (new id) is adopted
  // and resets per-card state; the live card going null is ignored (we're
  // mid-ack). Render-time "adjust state on prop change" pattern.
  const [state, dispatch] = useReducer(followUpReducer, card, initFollowUpState);
  const { shownCard, phase, ackStage, selected, released } = state;
  const shownId = shownCard?._id ?? null;
  if (card !== null && card._id !== shownId) {
    dispatch({ type: "adoptCard", card });
  }

  const showResources =
    !!shownCard && (shownCard.tier === "acute" || shownCard.escalationDerived);
  // Asking: track the live query (so a resolve/dismiss closes it). Ack: stay up
  // until the ack fade-out releases it, regardless of the live card going null.
  const effectiveOpen = !!shownCard && (phase === "ack" ? !released : isOpen);

  // Status chips play the ack micro-state first; the sheet releases after it.
  const handleChip = (key: string) => {
    onResolve(key as FollowUpResponse);
    dispatch({ type: "selectChip", key });
  };

  // "Let it out" is a different kind of action — the doorway into the voice-vent
  // flow. Resolve the card, close immediately, open the vent screen. No ack.
  const handleVent = () => {
    onResolve("vent");
    dispatch({ type: "release" });
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
          {shownCard == null ? null : phase === "asking" ? (
            // maxHeight + flexGrow:0 keeps the sheet hugging its content under
            // dynamic sizing (short content = no scroll) but caps it and scrolls
            // once content exceeds the cap on smaller devices. Same recipe as
            // FeedbackSheet.
            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              style={[styles.scroll, { maxHeight: maxSheetContent }]}
            >
              <View className="items-center px-6 pb-7 pt-1">
                <Image
                  source={MASCOT}
                  contentFit="contain"
                  style={styles.mascot}
                  accessibilityLabel={FOLLOW_UP_MASCOT_LABEL}
                />
                <BottomSheet.Title className="mt-1 text-center font-serif text-2xl leading-8 text-foreground">
                  {shownCard.cardText}
                </BottomSheet.Title>

                <View className="mt-6 w-full">
                  <FeedbackSheet.Chips
                    chips={chipsForTier(shownCard.tier)}
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
                    onPress={() => {
                      posthog.capture('follow_up_resources_tapped', { tier: shownCard.tier });
                      router.push("/crisis-resources");
                    }}
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
            </BottomSheetScrollView>
          ) : (
            <EaseView
              initialAnimate={ACK_IN_INITIAL}
              animate={ackStage === "in" ? ACK_IN_ANIMATE : ACK_OUT_ANIMATE}
              transition={
                ackStage === "in" ? ACK_IN_TRANSITION : ACK_OUT_TRANSITION
              }
              onTransitionEnd={({ finished }) => {
                if (!finished) return;
                // Fade-in done → hold + fade out; fade-out done → release.
                if (ackStage === "in") dispatch({ type: "ackInDone" });
                else dispatch({ type: "release" });
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
  // flexGrow:0 stops the scrollview from filling the sheet — it sizes to its
  // content up to maxHeight (set inline from the device dimensions).
  scroll: { flexGrow: 0 },
});
