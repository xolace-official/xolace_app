import type {
  ReflectionState,
  ReflectionAction,
  EntryType,
} from '@/interfaces/reflection';

export const MAX_TURNS = 2;

export const initialState: ReflectionState = {
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

/**
 * Produces the next reflection UI state given the current state and an action.
 *
 * @param state - Current reflection state
 * @param action - Action describing the update to apply
 * @returns The next ReflectionState after applying the provided action
 */
export function reducer(
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

    case 'DISMISS_TYPING':
      return { ...state, screen: 'idle', entryText: '' };

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

    case 'ESCALATION_TRIGGERED':
      return { ...state, screen: 'escalation', mirrorResponse: action.mirror };

    case 'THATS_IT':
      return { ...state, screen: 'path-selection' };

    case 'NOT_QUITE':
      return { ...state, screen: 'clarify', lastFeedbackType: 'not_quite' };

    case 'SAY_MORE':
      return { ...state, screen: 'clarify', lastFeedbackType: 'say_more' };

    case 'CLARIFY_TEXT_CHANGE':
      return { ...state, clarifyText: action.text };

    case 'SET_USER_VARIANT':
      return { ...state, userVariant: action.variant };

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
