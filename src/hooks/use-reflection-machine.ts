import { useReducer, useCallback, useEffect, useRef } from 'react';
import type {
  ReflectionState,
  ReflectionAction,
  EntryType,
  FeedbackType,
} from '@/interfaces/reflection';
import { useSession } from '@/hooks/use-session';
import { extractErrorMessage } from '@/services/session-service';

const MAX_TURNS = 2;

const initialState: ReflectionState = {
  screen: 'idle',
  entryText: '',
  clarifyText: '',
  mirrorResponse: '',
  errorMessage: '',
  lastFeedbackType: null,
  userVariant: { kind: 'first-time' },
  selectedTextures: [],
  entryType: 'typed',
};

function reducer(
  state: ReflectionState,
  action: ReflectionAction,
): ReflectionState {
  switch (action.type) {
    case 'TAP_INPUT':
      return {
        ...state,
        screen: 'typing',
        entryType: state.selectedTextures.length > 0 ? 'hybrid' : 'typed',
      };

    case 'TEXT_CHANGE': {
      const entryType: EntryType =
        state.selectedTextures.length > 0 ? 'hybrid' : 'typed';
      return { ...state, entryText: action.text, screen: 'typing', entryType };
    }

    case 'TOGGLE_TEXTURE': {
      const textures = state.selectedTextures.includes(action.word)
        ? state.selectedTextures.filter((w) => w !== action.word)
        : [...state.selectedTextures, action.word];
      return { ...state, selectedTextures: textures };
    }

    case 'SCAFFOLD_SUBMIT':
      return { ...state, screen: 'processing', entryType: 'scaffold' };

    case 'PAUSE_TIMEOUT':
      if (state.screen !== 'typing') return state;
      return { ...state, screen: 'typing-nudge' };

    case 'RESUME_TYPING':
      return { ...state, screen: 'typing' };

    case 'SUBMIT':
      return { ...state, screen: 'processing', clarifyText: '' };

    case 'MIRROR_RECEIVED':
      return { ...state, screen: 'mirror', mirrorResponse: action.mirror };

    case 'THATS_IT':
      return { ...state, screen: 'path-selection' };

    case 'NOT_QUITE':
      return { ...state, screen: 'clarify', lastFeedbackType: 'not_quite' };

    case 'SAY_MORE':
      return { ...state, screen: 'clarify', lastFeedbackType: 'say_more' };

    case 'CLARIFY_TEXT_CHANGE':
      return { ...state, clarifyText: action.text };

    case 'SESSION_ERROR':
      return { ...state, screen: 'error', errorMessage: action.message };

    case 'SESSION_RESUMED':
      return {
        ...state,
        screen: action.screen,
        mirrorResponse: action.mirrorResponse ?? state.mirrorResponse,
      };

    case 'RESET':
      return { ...initialState, userVariant: state.userVariant };

    default:
      return state;
  }
}

export function useReflectionMachine() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    serverState,
    mirrorText,
    errorMessage,
    turnsCount,
    isLoading,
    initiateAndSubmit,
    confirmMirror,
    submitRefinement,
    abandon,
    retry,
    resetSession,
  } = useSession();

  const prevServerStateRef = useRef<string | null>(null);
  const typingStartRef = useRef<number | null>(null);
  const freezeOccurredRef = useRef(false);
  const freezeStartRef = useRef<number | null>(null);
  const freezeDurationRef = useRef<number | undefined>(undefined);

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
          dispatch({ type: 'MIRROR_RECEIVED', mirror: mirrorText });
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
        dispatch({ type: 'RESET' });
        break;
    }
  }, [serverState, mirrorText, errorMessage, state.screen]);

  // Track freeze (typing-nudge = user paused)
  useEffect(() => {
    if (state.screen === 'typing-nudge') {
      freezeOccurredRef.current = true;
      freezeStartRef.current = Date.now();
    } else if (
      state.screen === 'typing' &&
      freezeStartRef.current
    ) {
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
    }
  }, [state.entryText, state.entryType, initiateAndSubmit]);

  const submitScaffold = useCallback(async () => {
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
    }
  }, [state.selectedTextures, initiateAndSubmit]);

  const submitClarification = useCallback(async () => {
    dispatch({ type: 'SUBMIT' });
    const feedbackType: FeedbackType =
      state.lastFeedbackType ?? 'not_quite';
    try {
      await submitRefinement(feedbackType, state.clarifyText);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Maximum refinement turns')
      ) {
        dispatch({
          type: 'SESSION_RESUMED',
          screen: 'gave-up',
        });
      } else {
        dispatch({
          type: 'SESSION_ERROR',
          message: extractErrorMessage(error),
        });
      }
    }
  }, [state.clarifyText, state.lastFeedbackType, submitRefinement]);

  const handleThatsIt = useCallback(async () => {
    dispatch({ type: 'THATS_IT' });
    try {
      const confirmationState = turnsCount > 0 ? 'refined' : 'confirmed';
      await confirmMirror(confirmationState);
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
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
    try {
      await confirmMirror('gave_up');
      dispatch({ type: 'THATS_IT' });
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
    }
  }, [confirmMirror]);

  const handleReset = useCallback(async () => {
    await abandon();
    resetSession();
    prevServerStateRef.current = null;
    typingStartRef.current = null;
    freezeOccurredRef.current = false;
    freezeStartRef.current = null;
    freezeDurationRef.current = undefined;
    dispatch({ type: 'RESET' });
  }, [abandon, resetSession]);

  const handleRetry = useCallback(async () => {
    try {
      await retry();
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', message: extractErrorMessage(error) });
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
    handleReset,
    handleRetry,
  };
}
