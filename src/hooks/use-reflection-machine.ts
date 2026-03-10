import { useReducer, useCallback } from 'react';
import type { ReflectionState, ReflectionAction, EntryType } from '@/interfaces/reflection';

const MAX_CLARIFY_ATTEMPTS = 3;

const MOCK_MIRROR =
  "There's something heavy sitting in your chest today. Not sharp \u2014 more like a weight you've been carrying so long you forgot it wasn't always there.";

const initialState: ReflectionState = {
  screen: 'idle',
  entryText: '',
  clarifyText: '',
  mirrorResponse: '',
  clarifyCount: 0,
  userVariant: { kind: 'first-time' },
  selectedTextures: [],
  entryType: 'typed',
};


/**
 * Drives state transitions for the reflection UI in response to dispatched actions.
 *
 * Handles updating screen, entry/clarify text, mirror responses, and clarify attempt counting.
 * Notable behaviours:
 * - TEXT_CHANGE, TAP_INPUT, RESUME_TYPING, PAUSE_TIMEOUT, SUBMIT, MIRROR_RECEIVED, THATS_IT, SAY_MORE and CLARIFY_TEXT_CHANGE update the corresponding fields and/or current screen.
 * - NOT_QUITE increments `clarifyCount` and sets `screen` to `clarify` or `gave-up` when `clarifyCount` reaches the configured maximum.
 * - RESET restores the initial state while preserving the existing `userVariant`.
 *
 * @param state - Current reflection state
 * @param action - Action describing the intended state transition
 * @returns The next reflection state after applying the action
 */

function reducer(state: ReflectionState, action: ReflectionAction): ReflectionState {
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

    case 'NOT_QUITE': {
      const nextCount = state.clarifyCount + 1;
      if (nextCount >= MAX_CLARIFY_ATTEMPTS) {
        return { ...state, screen: 'gave-up', clarifyCount: nextCount };
      }
      return { ...state, screen: 'clarify', clarifyCount: nextCount };
    }

    case 'SAY_MORE':
      return { ...state, screen: 'clarify' };

    case 'CLARIFY_TEXT_CHANGE':
      return { ...state, clarifyText: action.text };

    case 'RESET':
      return { ...initialState, userVariant: state.userVariant };

    default:
      return state;
  }
}


/**
 * Hook that manages the reflection UI state machine and exposes actions for submitting reflections and clarifications.
 *
 * The hook maintains the current screen, entry and clarify text, mirror response, clarify attempt count, and user variant,
 * and provides dispatchable actions to drive the state transitions (e.g., submit, mirror received, clarify, reset).
 *
 * @returns An object containing:
 * - `state` — the current reflection machine state (screen, entryText, clarifyText, mirrorResponse, clarifyCount, userVariant).
 * - `dispatch` — reducer dispatch function for sending actions to the state machine.
 * - `submitReflection` — triggers a submit action and (mock) populates the mirror response after a short delay.
 * - `submitClarification` — triggers a submit action and (mock) populates an alternative mirror response after a short delay.
 */

export function useReflectionMachine() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const submitReflection = useCallback(() => {
    dispatch({ type: 'SUBMIT' });
    setTimeout(() => {
      dispatch({ type: 'MIRROR_RECEIVED', mirror: MOCK_MIRROR });
    }, 3000);
  }, []);

  const submitScaffold = useCallback(() => {
    dispatch({ type: 'SCAFFOLD_SUBMIT' });
    setTimeout(() => {
      dispatch({ type: 'MIRROR_RECEIVED', mirror: MOCK_MIRROR });
    }, 3000);
  }, []);

  const submitClarification = useCallback(() => {
    dispatch({ type: 'SUBMIT' });
    // Mock AI delay with slightly different response
    setTimeout(() => {
      dispatch({
        type: 'MIRROR_RECEIVED',
        mirror:
          "I hear you more clearly now. It sounds like there's a quiet ache beneath the surface \u2014 not asking to be fixed, just asking to be seen.",
      });
    }, 3000);
  }, []);

  return {
    state,
    dispatch,
    submitReflection,
    submitScaffold,
    submitClarification,
  };
}
