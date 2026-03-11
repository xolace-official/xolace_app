import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReflectionMachine } from '@/hooks/use-reflection-machine';
import { IdleState } from '@/components/reflect/states/idle-state';
import { TypingState } from '@/components/reflect/states/typing-state';
import { ProcessingState } from '@/components/reflect/states/processing-state';
import { MirrorState } from '@/components/reflect/states/mirror-state';
import { ClarifyState } from '@/components/reflect/states/clarify-state';
import { GaveUpState } from '@/components/reflect/states/gave-up-state';
import { PathSelectionState } from '@/components/reflect/states/path-selection-state';

export const ReflectScreen = () => {
  const { state, dispatch, submitReflection, submitScaffold, submitClarification } =
    useReflectionMachine();
  const insets = useSafeAreaInsets();

  const screen = state.screen;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {screen === 'idle' && (
        <IdleState
          variant={state.userVariant}
          selectedTextures={state.selectedTextures}
          dispatch={dispatch}
          onTap={() => dispatch({ type: 'TAP_INPUT' })}
          onScaffoldSubmit={submitScaffold}
        />
      )}

      {(screen === 'typing' || screen === 'typing-nudge') && (
        <TypingState
          showNudge={screen === 'typing-nudge'}
          entryText={state.entryText}
          dispatch={dispatch}
          onSubmit={submitReflection}
        />
      )}

      {screen === 'processing' && <ProcessingState />}

      {screen === 'mirror' && (
        <MirrorState
          mirror={state.mirrorResponse}
          selectedTextures={state.selectedTextures}
          entryType={state.entryType}
          onThatsIt={() => dispatch({ type: 'THATS_IT' })}
          onNotQuite={() => dispatch({ type: 'NOT_QUITE' })}
          onSayMore={() => dispatch({ type: 'SAY_MORE' })}
        />
      )}

      {screen === 'clarify' && (
        <ClarifyState
          previousMirror={state.mirrorResponse}
          clarifyText={state.clarifyText}
          dispatch={dispatch}
          onSubmit={submitClarification}
        />
      )}

      {screen === 'gave-up' && (
        <GaveUpState
          onPathSelection={() => dispatch({ type: 'THATS_IT' })}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      )}

      {screen === 'path-selection' && (
        <PathSelectionState
          mirror={state.mirrorResponse}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      )}
    </View>
  );
};
