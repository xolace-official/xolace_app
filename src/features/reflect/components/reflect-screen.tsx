import { useEffect, useRef, useState } from "react";
import { StyleSheet, type ViewStyle, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MorphLoader } from "@/src/components/shared/loader/morph/morph-loader";
import { EaseView } from "react-native-ease";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useReflectionMachine } from "@/src/features/reflect/hooks/use-reflection-machine";
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
import { IdleState } from "@/src/features/reflect/components/states/idle-state";
import { TypingState } from "@/src/features/reflect/components/states/typing-state";
import { ProcessingState } from "@/src/features/reflect/components/states/processing-state";
import { MirrorState } from "@/src/features/reflect/components/states/mirror-state";
import { ClarifyState } from "@/src/features/reflect/components/states/clarify-state";
import { GaveUpState } from "@/src/features/reflect/components/states/gave-up-state";
import { PathSelectionState } from "@/src/features/reflect/components/states/path-selection-state";
import { EscalationState } from "@/src/features/reflect/components/states/escalation-state";
import { ErrorState } from "@/src/features/reflect/components/states/error-state";
import { SpaceNamePromptDialog } from "@/src/features/reflect/components/space-name-prompt-dialog";
import { ClarifyFeedbackSheet } from "@/src/features/reflect/components/states/clarify-feedback-sheet";

const EASE_ANIMATE_OUT = { opacity: 0 };

export const ReflectScreen = () => {
  const router = useRouter();
  const {
    state,
    dispatch,
    isLoading,
    sessionId,
    escalationResources,
    toneUsed,
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
  const context = useQuery(api.users.getFullContext);
  const updatePreferences = useMutation(api.preferences.update);
  const { current, previous, isTransitioning, onOutgoingComplete } =
    useScreenTransition(state.screen);

  const [showSpaceNameDialog, setShowSpaceNameDialog] = useState(false);
  const firedSpaceNameDialog = useRef(false);
  const [mirrorFeedbackOpen, setMirrorFeedbackOpen] = useState(false);
  const mirrorFeedbackShown = useRef(false);

  const handleNotQuiteWithFeedback = () => {
    if (!mirrorFeedbackShown.current) {
      mirrorFeedbackShown.current = true;
      setMirrorFeedbackOpen(true);
    }
    handleNotQuite();
  };

  const handleSayMoreWithFeedback = () => {
    if (!mirrorFeedbackShown.current) {
      mirrorFeedbackShown.current = true;
      setMirrorFeedbackOpen(true);
    }
    handleSayMore();
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

  useEffect(() => {
    if (current !== "path-selection") return;
    if (firedSpaceNameDialog.current) return;
    if (!context?.preferences) return;
    if (
      context.preferences.spaceName ||
      context.preferences.spaceNamePromptDismissed
    )
      return;
    firedSpaceNameDialog.current = true;
    setShowSpaceNameDialog(true);
  }, [current, context?.preferences]);

  const renderScreen = (screen: ReflectionStateName, isOutgoing = false) => {
    switch (screen) {
      case "idle":
        return (
          <IdleState
            variant={state.userVariant}
            quietReturn={state.quietReturn}
            selectedTextures={state.selectedTextures}
            dispatch={dispatch}
            onTap={() => dispatch({ type: "TAP_INPUT" })}
            onScaffoldSubmit={submitScaffold}
            onVoiceTap={startVoiceFromIdle}
            isRecording={isRecording}
            spaceName={context?.preferences?.spaceName}
          />
        );
      case "typing":
      case "typing-nudge":
        return (
          <TypingState
            showNudge={state.screen === "typing-nudge"}
            entryText={state.entryText}
            dispatch={dispatch}
            onSubmit={submitReflection}
            onDismiss={handleDismissTyping}
            onVoiceTap={startVoiceFromTyping}
            isRecording={isRecording}
            autoFocus={!isOutgoing}
          />
        );
      case "processing":
        return <ProcessingState />;
      case "mirror":
        return (
          <MirrorState
            mirror={state.mirrorResponse}
            selectedTextures={state.selectedTextures}
            entryType={state.entryType}
            sessionId={sessionId}
            toneUsed={toneUsed}
            onThatsIt={handleThatsIt}
            onNotQuite={handleNotQuiteWithFeedback}
            onSayMore={handleSayMoreWithFeedback}
          />
        );
      case "clarify":
        return (
          <ClarifyState
            previousMirror={state.mirrorResponse}
            clarifyText={state.clarifyText}
            dispatch={dispatch}
            onSubmit={submitClarification}
            autoFocus={!isOutgoing && !mirrorFeedbackOpen}
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
            mirror={state.mirrorResponse}
            resources={escalationResources}
            onEngage={handleEscalationEngage}
            onDismiss={handleEscalationDismiss}
            onContinue={handleEscalationContinue}
          />
        );
      case "path-selection":
        return (
          <PathSelectionState
            mirror={state.mirrorResponse}
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

  const isIdle = current === "idle";
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
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          hidden={!isIdle}
          icon="person.circle"
          onPress={() => router.push("/(protected)/profile")}
        />
        <Stack.Toolbar.Button
          hidden={!isIdle}
          icon="lifepreserver"
          onPress={() => router.push("/crisis-resources?from=idle_button")}
        />
      </Stack.Toolbar>
      {/* Outgoing screen — fades out then unmounts */}
      {previous && previousConfig && (
        <EaseView
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
        turnIndex={turnsCount}
        isOpen={mirrorFeedbackOpen}
        onClose={() => setMirrorFeedbackOpen(false)}
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
