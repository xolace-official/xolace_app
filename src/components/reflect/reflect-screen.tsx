import { ActivityIndicator, StyleSheet, type ViewStyle, View } from 'react-native';
import { EaseView } from 'react-native-ease';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReflectionMachine } from '@/hooks/use-reflection-machine';
import { useScreenTransition } from '@/hooks/use-screen-transition';
import { SCREEN_TRANSITIONS, DEFAULT_SCREEN_TRANSITION } from '@/constants/reflect-transitions';
import type { ReflectionStateName } from '@/interfaces/reflection';
import { IdleState } from '@/components/reflect/states/idle-state';
import { TypingState } from '@/components/reflect/states/typing-state';
import { ProcessingState } from '@/components/reflect/states/processing-state';
import { MirrorState } from '@/components/reflect/states/mirror-state';
import { ClarifyState } from '@/components/reflect/states/clarify-state';
import { GaveUpState } from '@/components/reflect/states/gave-up-state';
import { PathSelectionState } from '@/components/reflect/states/path-selection-state';
import { ErrorState } from '@/components/reflect/states/error-state';

export const ReflectScreen = () => {
  const {
    state,
    dispatch,
    isLoading,
    submitReflection,
    submitScaffold,
    submitClarification,
    handleThatsIt,
    handleNotQuite,
    handleSayMore,
    handleGaveUpPathSelection,
    handleSelectExit,
    handleSelectSolo,
    handleSelectPeers,
    handleReset,
    handleRetry,
  } = useReflectionMachine();
  const insets = useSafeAreaInsets();
  const { current, previous, isTransitioning, onOutgoingComplete } =
    useScreenTransition(state.screen);

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  const renderScreen = (screen: ReflectionStateName, isOutgoing = false) => {
    switch (screen) {
      case 'idle':
        return (
          <IdleState
            variant={state.userVariant}
            selectedTextures={state.selectedTextures}
            dispatch={dispatch}
            onTap={() => dispatch({ type: 'TAP_INPUT' })}
            onScaffoldSubmit={submitScaffold}
          />
        );
      case 'typing':
      case 'typing-nudge':
        return (
          <TypingState
            showNudge={state.screen === 'typing-nudge'}
            entryText={state.entryText}
            dispatch={dispatch}
            onSubmit={submitReflection}
            autoFocus={!isOutgoing}
          />
        );
      case 'processing':
        return <ProcessingState />;
      case 'mirror':
        return (
          <MirrorState
            mirror={state.mirrorResponse}
            selectedTextures={state.selectedTextures}
            entryType={state.entryType}
            onThatsIt={handleThatsIt}
            onNotQuite={handleNotQuite}
            onSayMore={handleSayMore}
          />
        );
      case 'clarify':
        return (
          <ClarifyState
            previousMirror={state.mirrorResponse}
            clarifyText={state.clarifyText}
            dispatch={dispatch}
            onSubmit={submitClarification}
            autoFocus={!isOutgoing}
          />
        );
      case 'gave-up':
        return (
          <GaveUpState
            onPathSelection={handleGaveUpPathSelection}
            onReset={handleReset}
          />
        );
      case 'path-selection':
        return (
          <PathSelectionState
            mirror={state.mirrorResponse}
            onSelectSolo={handleSelectSolo}
            onSelectPeers={handleSelectPeers}
            onSelectExit={handleSelectExit}
          />
        );
      case 'error':
        return (
          <ErrorState
            errorMessage={state.errorMessage || 'Something went wrong.'}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        );
    }
  };

  const currentConfig = SCREEN_TRANSITIONS[current] ?? DEFAULT_SCREEN_TRANSITION;
  const previousConfig = previous
    ? (SCREEN_TRANSITIONS[previous] ?? DEFAULT_SCREEN_TRANSITION)
    : null;

  const absoluteWithInsets: ViewStyle = {
    position: 'absolute',
    top: insets.top,
    left: 0,
    right: 0,
    bottom: insets.bottom,
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Outgoing screen — fades out then unmounts */}
      {previous && previousConfig && (
        <EaseView
          animate={{ opacity: 0 }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
