import { useEffect, useState } from "react";
import { StyleSheet, type ViewStyle, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import AccountCircle from "@expo/material-symbols/account_circle.xml";
import CrisisAlert from "@expo/material-symbols/crisis_alert.xml";
import { useThemeColor } from "heroui-native";
import { MorphLoader } from "@/src/components/shared/loader/morph/morph-loader";
import { EaseView } from "react-native-ease";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useReflectionMachine } from "@/src/features/reflect/hooks/use-reflection-machine";
import { MAX_TURNS } from "@/src/features/reflect/hooks/reflection-reducer";
import { useScreenTransition } from "@/src/features/reflect/hooks/use-screen-transition";
import {
  SCREEN_TRANSITIONS,
  DEFAULT_SCREEN_TRANSITION,
} from "@/src/features/reflect/reflect-transitions";
import {
  computeUserVariant,
  computeQuietReturn,
} from "@/src/helpers/utils/user-variant";
import type { ReflectionStateName } from "@/src/features/reflect/types";
import { ComposeScreen } from "@/src/features/reflect/compose/compose-screen";
import { ProcessingState } from "@/src/features/reflect/components/states/processing-state";
import { MirrorState } from "@/src/features/reflect/components/states/mirror-state";
import { ClarifyState } from "@/src/features/reflect/components/states/clarify-state";
import { GaveUpState } from "@/src/features/reflect/components/states/gave-up-state";
import { PathSelectionState } from "@/src/features/reflect/components/states/path-selection-state";
import { EscalationState } from "@/src/features/reflect/components/states/escalation-state";
import { ErrorState } from "@/src/features/reflect/components/states/error-state";
import { ReflectWash } from "@/src/features/reflect/components/reflect-wash";
import { SpaceNamePromptDialog } from "@/src/features/reflect/components/space-name-prompt-dialog";
import { ClarifyFeedbackSheet } from "@/src/features/reflect/components/states/clarify-feedback-sheet";
import { useFeedbackShake } from "@/src/features/feedback-tray/feedback-tray-provider";

// EaseView only runs a transition — and only then emits onTransitionEnd — when
// initialAnimate differs from animate. Without an explicit opacity: 1 start the
// outgoing screen mounts already at opacity 0, no animation runs, and
// onOutgoingComplete never fires, leaving it mounted forever.
const EASE_ANIMATE_OUT_INITIAL = { opacity: 1 };
const EASE_ANIMATE_OUT = { opacity: 0 };

const WASH_FADE_IN = FadeIn.duration(300);
const WASH_FADE_OUT = FadeOut.duration(300);

const WASH_SCREENS: ReflectionStateName[] = ["idle", "typing", "typing-nudge"];
const isWashScreen = (screen: ReflectionStateName) =>
  WASH_SCREENS.includes(screen);

export const ReflectScreen = () => {
  const router = useRouter();
  const {
    state,
    dispatch,
    isLoading,
    sessionId,
    mirrorText,
    escalationResources,
    toneUsed,
    claimStrength,
    isRecording,
    submitReflection,
    submitScaffold,
    submitClarification,
    handleThatsIt,
    handleNotQuite,
    handleSayMore,
    handleGaveUpPathSelection,
    handleEscalationEngage,
    handleEscalationContinue,
    handleEscalationDismiss,
    handleSelectExit,
    handleSelectSolo,
    handleSelectPeers,
    handleReset,
    handleRetry,
    startVoiceFromIdle,
    startVoiceFromTyping,
    handleDismissTyping,
    turnsCount,
  } = useReflectionMachine();
  const insets = useSafeAreaInsets();
  const safeAreaStyle = { paddingTop: insets.top, paddingBottom: insets.bottom };
  // Warm amber 'warning' tint sets the crisis button apart without the alarm of
  // a hard red — gentle but present, in keeping with the campfire palette.
  const crisisTint = useThemeColor("warning") as string;

  // Shake-to-feedback on the reflect canvas: suppressed only during active
  // articulation (typing / nudge / processing). Allowed in idle, mirror, and
  // every other state — a shake there is signal, not noise. `enabled` is
  // pure-derived from machine state, no syncing effect.
  useFeedbackShake({
    enabled:
      state.screen !== "typing" &&
      state.screen !== "typing-nudge" &&
      state.screen !== "processing",
  });
  const context = useQuery(api.users.getFullContext);
  const updatePreferences = useMutation(api.preferences.update);
  const { current, previous, isTransitioning, onOutgoingComplete } =
    useScreenTransition(state.screen);

  const [showSpaceNameDialog, setShowSpaceNameDialog] = useState(false);
  const [spaceNameDialogFired, setSpaceNameDialogFired] = useState(false);
  const [mirrorFeedbackTurn, setMirrorFeedbackTurn] = useState<number | null>(null);
  const [mirrorFeedbackShown, setMirrorFeedbackShown] = useState(false);

  // Visible only while clarify is settled and on top. Derived, so leaving
  // clarify — "← Back to mirror", give-up on the last turn, escalation, an
  // error — closes the sheet instead of stranding it over another screen.
  const mirrorFeedbackOpen =
    mirrorFeedbackTurn !== null &&
    current === "clarify" &&
    !isTransitioning &&
    sessionId !== null;


  const [prevScreen, setPrevScreen] = useState(state.screen);
  if (state.screen !== prevScreen) {
    setPrevScreen(state.screen);
    if (mirrorFeedbackTurn !== null && state.screen !== "clarify") {
      setMirrorFeedbackTurn(null);
    }
    // Idle is the start of a session, so re-arm the one-per-session feedback
    // sheet here — the screen stays mounted across sessions ("Start fresh",
    // "Have more? I'm here."), and without this the sheet would only ever be
    // offered for the first session of the mount.
    if (state.screen === "idle" && mirrorFeedbackShown) {
      setMirrorFeedbackShown(false);
    }
  }

  const handleNotQuiteWithFeedback = () => {
    if (!mirrorFeedbackShown) {
      setMirrorFeedbackShown(true);
      setMirrorFeedbackTurn(turnsCount);
    }
    handleNotQuite();
  };

  useEffect(() => {
    if (!context?.profile) return;
    dispatch({
      type: "SET_USER_VARIANT",
      variant: computeUserVariant(context.profile),
    });
    dispatch({
      type: "SET_QUIET_RETURN",
      tier: computeQuietReturn(context.profile),
    });
  }, [context?.profile, dispatch]);


  if (
    current === "path-selection" &&
    !spaceNameDialogFired &&
    context?.preferences &&
    !context.preferences.spaceName &&
    !context.preferences.spaceNamePromptDismissed
  ) {
    setSpaceNameDialogFired(true);
    setShowSpaceNameDialog(true);
  }

  const renderScreen = (screen: ReflectionStateName, isOutgoing = false) => {
    switch (screen) {
      // idle normalizes to typing (#256): one compose screen renders both, and
      // which one it is reading as comes from state.screen, not from `screen`.
      case "idle":
      case "typing":
      case "typing-nudge":
        return (
          <ComposeScreen
            screen={state.screen}
            // The outgoing copy is a fading picture of the screen being left;
            // it must not pull focus from the one arriving.
            focusOnExpand={!isOutgoing}
            variant={state.userVariant}
            quietReturn={state.quietReturn}
            selectedTextures={state.selectedTextures}
            entryText={state.entryText}
            dispatch={dispatch}
            onTap={() => dispatch({ type: "TAP_INPUT" })}
            onSubmit={submitReflection}
            onDismiss={handleDismissTyping}
            onScaffoldSubmit={submitScaffold}
            onVoiceTapIdle={startVoiceFromIdle}
            onVoiceTapTyping={startVoiceFromTyping}
            isRecording={isRecording}
            spaceName={context?.preferences?.spaceName}
          />
        );
      case "processing":
        return <ProcessingState />;
      case "mirror":
        return (
          <MirrorState
            mirror={mirrorText ?? ""}
            selectedTextures={state.selectedTextures}
            entryType={state.entryType}
            sessionId={sessionId}
            toneUsed={toneUsed}
            claimStrength={claimStrength}
            atCap={turnsCount >= MAX_TURNS}
            onThatsIt={handleThatsIt}
            onNotQuite={handleNotQuiteWithFeedback}
            onSayMore={handleSayMore}
          />
        );
      case "clarify":
        return (
          <ClarifyState
            previousMirror={mirrorText ?? ""}
            clarifyText={state.clarifyText}
            dispatch={dispatch}
            onSubmit={submitClarification}
            // Armed, not open: the sheet is still transitioning in at mount
            // time, and autoFocus would raise the keyboard underneath it.
            autoFocus={!isOutgoing && mirrorFeedbackTurn === null}
          />
        );
      case "gave-up":
        return (
          <GaveUpState
            onPathSelection={handleGaveUpPathSelection}
            onReset={handleReset}
            sessionId={sessionId ?? undefined}
          />
        );
      case "escalation":
        return (
          <EscalationState
            mirror={mirrorText ?? ""}
            resources={escalationResources}
            onEngage={handleEscalationEngage}
            onDismiss={handleEscalationDismiss}
            onContinue={handleEscalationContinue}
          />
        );
      case "path-selection":
        return (
          <PathSelectionState
            mirror={mirrorText ?? ""}
            sessionId={sessionId}
            mirrorLanded={
              claimStrength !== "reaching" &&
              claimStrength !== "holding" &&
              turnsCount < MAX_TURNS
            }
            onSelectSolo={handleSelectSolo}
            onSelectPeers={handleSelectPeers}
            onSelectExit={handleSelectExit}
          />
        );
      case "error":
        return (
          <ErrorState
            errorMessage={state.errorMessage || "Something went wrong."}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        );
    }
  };

  const currentConfig =
    SCREEN_TRANSITIONS[current] ?? DEFAULT_SCREEN_TRANSITION;
  const previousConfig = previous
    ? (SCREEN_TRANSITIONS[previous] ?? DEFAULT_SCREEN_TRANSITION)
    : null;

  const absoluteWithInsets: ViewStyle = {
    position: "absolute",
    top: insets.top,
    left: 0,
    right: 0,
    bottom: insets.bottom,
  };

  // The settled screen name is `typing` for both idle and composing since #256,
  // so the header follows the reducer's own state: it belongs to the resting
  // card, and it gets out of the way the moment the composer opens.
  const isIdle = state.screen === "idle";
  // The wash belongs to the idle/typing canvas. It stays mounted while an
  // outgoing idle/typing screen is still fading, so it leaves with that screen
  // rather than popping out from under the one replacing it.
  const showWash =
    isWashScreen(current) || (previous !== null && isWashScreen(previous));
  const stackScreenOptions = {
    headerShown: isIdle,
    headerTransparent: true,
    headerTitle: "",
    headerShadowVisible: false,
    headerBackVisible: false,
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={safeAreaStyle}
      >
        <MorphLoader />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={safeAreaStyle}>
      <Stack.Screen options={stackScreenOptions} />
      {showWash && (
        <Animated.View
          entering={WASH_FADE_IN}
          exiting={WASH_FADE_OUT}
          pointerEvents="none"
          // Absolute children lay out against the border box, so this ignores
          // the host's safe-area padding and the wash runs edge to edge —
          // under the status bar and the home indicator.
          style={StyleSheet.absoluteFill}
        >
          <ReflectWash />
        </Animated.View>
      )}
      {/* Mounted only while idle. A `hidden` toolbar button still leaves its
          transparent host view laid out across the top of the screen on
          Android, where (unlike UIKit) an invisible view still consumes
          touches — that band swallowed the typing screen's mic and close. */}
      {isIdle && (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button
              icon={
                process.env.EXPO_OS === "ios" ? "person.circle" : AccountCircle
              }
              onPress={() => router.push("/(protected)/profile")}
            />
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon={
                process.env.EXPO_OS === "ios" ? "lifepreserver" : CrisisAlert
              }
              tintColor={crisisTint}
              onPress={() => router.push("/crisis-resources?from=idle_button")}
            />
          </Stack.Toolbar>
        </>
      )}
      {/* Outgoing screen — fades out then unmounts */}
      {previous && previousConfig && (
        <EaseView
          initialAnimate={EASE_ANIMATE_OUT_INITIAL}
          animate={EASE_ANIMATE_OUT}
          transition={previousConfig.exit.transition}
          onTransitionEnd={onOutgoingComplete}
          style={absoluteWithInsets}
        >
          {renderScreen(previous, true)}
        </EaseView>
      )}

      {/* Current screen — fades/springs in */}
      <EaseView
        key={current}
        initialAnimate={currentConfig.enter.initialAnimate}
        animate={currentConfig.enter.animate}
        transition={currentConfig.enter.transition}
        style={isTransitioning ? absoluteWithInsets : styles.fill}
      >
        {renderScreen(current)}
      </EaseView>

      {/* Mirror feedback — fires when user rejects a mirror, persists through screen transition */}
      <ClarifyFeedbackSheet
        sessionId={sessionId}
        turnIndex={mirrorFeedbackTurn ?? 0}
        isOpen={mirrorFeedbackOpen}
        onClose={() => setMirrorFeedbackTurn(null)}
      />

      {/* Space naming — fires once on first path-selection when unnamed */}
      <SpaceNamePromptDialog
        isOpen={showSpaceNameDialog}
        onSave={async (name) => {
          await updatePreferences({ spaceName: name });
          setShowSpaceNameDialog(false);
        }}
        onDismiss={async () => {
          await updatePreferences({ spaceNamePromptDismissed: true });
          setShowSpaceNameDialog(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
