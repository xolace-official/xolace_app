import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { FeedbackType } from '@/src/interfaces/reflection';
import { useSession } from '@/src/hooks/use-session';
import { extractErrorMessage } from '@/src/services/session-service';
import { MAX_TURNS, initialState, reducer } from './reflection-reducer';

/**
 * Manages the reflection UI state machine and bridges it to the session API.
 *
 * Provides the current reflection state, a reducer dispatch, loading status, and a set of actions that submit reflections, handle clarifications and confirmations, select paths, and control or reset the session.
 *
 * @returns An object with:
 * - `state` — the current `ReflectionState` for the UI.
 * - `dispatch` — reducer dispatch function for local state actions.
 * - `isLoading` — `true` while session data is loading.
 * - `submitReflection` — submit the current typed entry to the session.
 * - `submitScaffold` — submit a scaffolded entry built from selected textures.
 * - `submitClarification` — submit a clarification/refinement for the last mirror.
 * - `handleThatsIt` — confirm the mirror as final (or refined when applicable).
 * - `handleNotQuite` — transition to the "not quite" clarification flow or give up when turns exhausted.
 * - `handleSayMore` — transition to the "say more" clarification flow or give up when turns exhausted.
 * - `handleGaveUpPathSelection` — confirm a "gave up" path and advance to completion.
 * - `handleSelectExit` — select the "exit" path for session-end navigation.
 * - `handleSelectSolo` — select the "solo" path.
 * - `handleSelectPeers` — select the "peers" path.
 * - `handleReset` — abandon the current session and reset local state.
 * - `handleRetry` — request the session to retry the last action.
 */
export function useReflectionMachine() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    session,
    serverState,
    mirrorText,
    errorMessage,
    turnsCount,
    isLoading,
    initiateAndSubmit,
    confirmMirror,
    selectPath,
    submitRefinement,
    recordEscalationResponse,
    abandon,
    retry,
    resetSession,
  } = useSession();

  const prevServerStateRef = useRef<string | null>(null);
  const typingStartRef = useRef<number | null>(null);
  const freezeOccurredRef = useRef(false);
  const freezeStartRef = useRef<number | null>(null);
  const freezeDurationRef = useRef<number | undefined>(undefined);
  const busyRef = useRef(false);

  const clearRefs = useCallback(() => {
    prevServerStateRef.current = null;
    typingStartRef.current = null;
    freezeOccurredRef.current = false;
    freezeStartRef.current = null;
    freezeDurationRef.current = undefined;
    busyRef.current = false;
  }, []);

  // --- Bridge server state changes to UI dispatches ---
  useEffect(() => {
    if (!serverState || serverState === prevServerStateRef.current) return;
    prevServerStateRef.current = serverState;

    switch (serverState) {
      case 'processing':
        if (state.screen !== 'processing') {
          dispatch({ type: 'SUBMIT' });
        }
        break;
      case 'mirror_delivered':
        if (mirrorText) {
          console.log('mirrorText', mirrorText);
          console.log('session', session);
          if (session?.escalationTriggered) {
            dispatch({ type: 'ESCALATION_TRIGGERED', mirror: mirrorText });
          } else {
            dispatch({ type: 'MIRROR_RECEIVED', mirror: mirrorText });
          }
        }
        break;
      case 'confirmed':
        if (state.screen !== 'path-selection') {
          dispatch({ type: 'THATS_IT' });
        }
        break;
      case 'error':
        dispatch({
          type: 'SESSION_ERROR',
          message: errorMessage ?? 'Something went wrong.',
        });
        break;
      case 'abandoned':
      case 'completed':
        // Terminal states — reset UI for a fresh session
        resetSession();
        clearRefs();
        dispatch({ type: 'RESET' });
        break;
    }
  }, [serverState, mirrorText, errorMessage, state.screen, session, resetSession, clearRefs]);

  // Track freeze (typing-nudge = user paused)
  useEffect(() => {
    if (state.screen === 'typing-nudge') {
      freezeOccurredRef.current = true;
      freezeStartRef.current = Date.now();
    } else if (state.screen === 'typing' && freezeStartRef.current) {
      freezeDurationRef.current =
        (freezeDurationRef.current ?? 0) +
        (Date.now() - freezeStartRef.current);
      freezeStartRef.current = null;
    }
  }, [state.screen]);

  // Track typing start
  useEffect(() => {
    if (state.screen === 'typing' && !typingStartRef.current) {
      typingStartRef.current = Date.now();
    }
  }, [state.screen]);

  const submitReflection = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    dispatch({ type: 'SUBMIT' });
    const duration = typingStartRef.current
      ? Date.now() - typingStartRef.current
      : undefined;
    try {
      await initiateAndSubmit(
        state.entryText,
        state.entryType,
        duration,
        freezeOccurredRef.current,
        freezeDurationRef.current,
      );
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [state.entryText, state.entryType, initiateAndSubmit]);

  const submitScaffold = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    dispatch({ type: 'SCAFFOLD_SUBMIT' });
    try {
      await initiateAndSubmit(
        state.selectedTextures.join(', '),
        'scaffold',
        undefined,
        false,
      );
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [state.selectedTextures, initiateAndSubmit]);

  const submitClarification = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    dispatch({ type: 'SUBMIT' });
    const feedbackType: FeedbackType = state.lastFeedbackType ?? 'not_quite';
    try {
      await submitRefinement(feedbackType, state.clarifyText);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Maximum refinement turns')
      ) {
        dispatch({ type: 'SESSION_RESUMED', screen: 'gave-up' });
      } else {
        dispatch({
          type: 'SESSION_ERROR',
          message: extractErrorMessage(error),
        });
      }
    } finally {
      busyRef.current = false;
    }
  }, [state.clarifyText, state.lastFeedbackType, submitRefinement]);

  const handleThatsIt = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    dispatch({ type: 'THATS_IT' });
    try {
      const confirmationState = turnsCount > 0 ? 'refined' : 'confirmed';
      await confirmMirror(confirmationState);
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [turnsCount, confirmMirror]);

  const handleNotQuite = useCallback(() => {
    if (turnsCount >= MAX_TURNS) {
      dispatch({ type: 'SESSION_RESUMED', screen: 'gave-up' });
    } else {
      dispatch({ type: 'NOT_QUITE' });
    }
  }, [turnsCount]);

  const handleSayMore = useCallback(() => {
    if (turnsCount >= MAX_TURNS) {
      dispatch({ type: 'SESSION_RESUMED', screen: 'gave-up' });
    } else {
      dispatch({ type: 'SAY_MORE' });
    }
  }, [turnsCount]);

  const handleGaveUpPathSelection = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await confirmMirror('gave_up');
      dispatch({ type: 'THATS_IT' });
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [confirmMirror]);

  const handleSelectExit = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await selectPath('exit');
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [selectPath]);

  const handleSelectSolo = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await selectPath('solo');
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [selectPath]);

  const handleSelectPeers = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await selectPath('peers');
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [selectPath]);

  const handleEscalationEngage = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await recordEscalationResponse('engaged');
      // TODO: transition to dedicated resources screen once built
      const confirmation = turnsCount > 0 ? 'refined' : 'confirmed';
      await confirmMirror(confirmation);
      dispatch({ type: 'THATS_IT' });
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [recordEscalationResponse, confirmMirror, turnsCount]);

  const handleEscalationDismiss = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await recordEscalationResponse('dismissed');
      const confirmation = turnsCount > 0 ? 'refined' : 'confirmed';
      await confirmMirror(confirmation);
      dispatch({ type: 'THATS_IT' });
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [recordEscalationResponse, confirmMirror, turnsCount]);

  const handleReset = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await abandon();
    } finally {
      resetSession();
      clearRefs();
      dispatch({ type: 'RESET' });
      busyRef.current = false;
    }
  }, [abandon, resetSession, clearRefs]);

  const handleRetry = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await retry();
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    } finally {
      busyRef.current = false;
    }
  }, [retry]);

  return {
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
    handleEscalationEngage,
    handleEscalationDismiss,
    handleSelectExit,
    handleSelectSolo,
    handleSelectPeers,
    handleReset,
    handleRetry,
  };
}
