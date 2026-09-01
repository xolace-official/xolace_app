import { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useNavigation } from "expo-router";
import { PressableFeedback } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { Tour } from "@/src/components/ui/tour";
import { FluxPerch } from "@/src/features/reflect/compose/flux-perch";
import { MorphCard } from "@/src/features/reflect/compose/morph-card";
import { ComposeSurround } from "@/src/features/reflect/compose/compose-surround";
import { resolveCardContent } from "@/src/features/reflect/compose/resolve-card-content";
import { useMorph } from "@/src/features/reflect/compose/use-morph";
import { useReflectTour } from "@/src/features/reflect/hooks/use-reflect-tour";
import { useTypingPause } from "@/src/features/reflect/hooks/use-typing-pause";
import {
  DAY_NUDGE_DELAY_MS,
  NIGHT_NUDGE_DELAY_MS,
} from "@/src/features/reflect/night-copy";
import type { QuietReturnTier } from "@/src/features/reflect/quiet-return-copy";
import type {
  ReflectionAction,
  ReflectionStateName,
  UserVariant,
} from "@/src/features/reflect/types";
import { useSessionMode } from "@/src/context/session-mode-context";
import { useEffectiveReducedMotion } from "@/src/lib/motion/use-effective-reduced-motion";
import { playHomeEntrance, playTypingBegin } from "@/src/lib/haptics";
import { useAppStore } from "@/src/store/store";

const NUDGE_MESSAGES = [
  "There's no rush. Let it come.",
  "Even a few words are enough.",
  "You don't need to explain, just say what's there.",
];

type Props = {
  screen: ReflectionStateName;
  variant: UserVariant;
  quietReturn: QuietReturnTier | null;
  selectedTextures: string[];
  entryText: string;
  dispatch: React.Dispatch<ReflectionAction>;
  onTap: () => void;
  onSubmit: () => void;
  onDismiss: () => void;
  onScaffoldSubmit: () => void;
  onVoiceTapIdle: () => void;
  onVoiceTapTyping: () => void;
  isRecording: boolean;
  spaceName?: string;
  /** False for the outgoing copy during a cross-fade to another state. */
  focusOnExpand?: boolean;
};

/**
 * Idle and composing, as one screen (#256).
 *
 * The reducer still distinguishes `idle`, `typing` and `typing-nudge`; what
 * changed is that none of them mounts a different tree. A single progress value
 * — 0 at rest, 1 composing — is the only thing separating the two readings, so
 * tapping the card opens the page already in front of the user instead of
 * replacing the screen with another one.
 */
export const ComposeScreen = ({
  screen,
  variant,
  quietReturn,
  selectedTextures,
  entryText,
  dispatch,
  onTap,
  onSubmit,
  onDismiss,
  onScaffoldSubmit,
  onVoiceTapIdle,
  onVoiceTapTyping,
  isRecording,
  spaceName,
  focusOnExpand = true,
}: Props) => {
  const { isNight } = useSessionMode();
  const navigation = useNavigation();
  const reduceMotion = useEffectiveReducedMotion();

  const expanded = screen !== "idle";
  const showNudge = screen === "typing-nudge";
  const inputRef = useRef<TextInput>(null);

  const pendingEventPrompt = useAppStore((s) => s.pendingEventPrompt);
  // Read the clock once at mount (lazy init keeps the call out of the render
  // body so React Compiler can still optimize this component). The prompt has a
  // multi-day expiry, so mount-time accuracy is sufficient.
  const [now] = useState(() => Date.now());
  const eventPromptActive =
    !!pendingEventPrompt && pendingEventPrompt.expiresAt > now;
  const activeEventPrompt = eventPromptActive ? pendingEventPrompt.text : null;
  const activeEventLabel = eventPromptActive
    ? (pendingEventPrompt.label ?? null)
    : null;
  const activeQuietReturn = !isNight ? quietReturn : null;

  const card = resolveCardContent({
    isNight,
    quietReturnTier: activeQuietReturn,
    eventPrompt: activeEventPrompt,
  });

  const [nudgeMessage] = useState(
    () => NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)],
  );

  const { resetTimer, clearTimer } = useTypingPause(
    () => dispatch({ type: "PAUSE_TIMEOUT" }),
    isNight ? NIGHT_NUDGE_DELAY_MS : DAY_NUDGE_DELAY_MS,
  );

  const { progress, fade } = useMorph({
    expanded,
    reduceMotion,
    focusOnExpand,
    inputRef,
    // The nudge is a thing that happens while writing; closing the card ends
    // the sentence, so the pending countdown goes with it.
    onCollapse: clearTimer,
  });

  const { isActive: tourActive, finish, skip, trackStep } = useReflectTour();
  const setReflectTourSeen = useAppStore((s) => s.setReflectTourSeen);

  // Dismiss the tour if the user navigates away (e.g. the header's Help button)
  useEffect(() => {
    const unsub = navigation.addListener("blur", () => {
      if (tourActive) skip();
    });
    return unsub;
  }, [navigation, tourActive, skip]);

  // Flux's entrance is a spring started on his own mount, so firing the haptic
  // here lands them in the same frame.
  const entranceFired = useRef(false);
  useEffect(() => {
    if (entranceFired.current) return;
    entranceFired.current = true;
    playHomeEntrance();
  }, []);

  const handleTap = () => {
    playTypingBegin();
    onTap();
  };

  const handleChangeText = (text: string) => {
    dispatch({ type: "TEXT_CHANGE", text });
    if (showNudge) dispatch({ type: "RESUME_TYPING" });
    if (text.length > 0) resetTimer();
    else clearTimer();
  };

  return (
    <Tour open={tourActive} onFinish={finish} onSkip={skip} onStepChange={trackStep}>
      <View className="flex-1">
        {/* The card and its mascot live over the page, so their geometry is
            independent of everything around them. The surround renders after,
            so an opened menu is not painted over by the card beneath it. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <FluxPerch
            progress={progress}
            fade={fade}
            expanded={expanded}
            reduceMotion={reduceMotion}
          />

          <MorphCard
            progress={progress}
            fade={fade}
            expanded={expanded}
            card={card}
            entryText={entryText}
            showNudge={showNudge}
            nudgeMessage={nudgeMessage}
            isRecording={isRecording}
            inputRef={inputRef}
            onOpen={handleTap}
            onChangeText={handleChangeText}
            onSubmit={onSubmit}
            onDismiss={onDismiss}
            onVoiceTap={onVoiceTapTyping}
          />
        </View>

        <ComposeSurround
          progress={progress}
          fade={fade}
          expanded={expanded}
          reduceMotion={reduceMotion}
          variant={variant}
          isNight={isNight}
          activeQuietReturn={activeQuietReturn}
          eventPrompt={activeEventPrompt}
          eventLabel={activeEventLabel}
          spaceName={spaceName}
          selectedTextures={selectedTextures}
          dispatch={dispatch}
          onScaffoldSubmit={onScaffoldSubmit}
          onVoiceTap={onVoiceTapIdle}
          isRecording={isRecording}
        />

        {/* DEV ONLY — tap to restart tour for testing */}
        {__DEV__ && !tourActive && !expanded && (
          <PressableFeedback
            onPress={() => setReflectTourSeen(false)}
            className="absolute bottom-5 right-4 p-3"
            hitSlop={8}
          >
            <AppText className="text-xs text-foreground/25">↺ tour</AppText>
          </PressableFeedback>
        )}
      </View>
    </Tour>
  );
};
