import type { EntryType, ReflectionStateName } from '@/interfaces/reflection';

type ServerEntryType =
  | 'open_prompt'
  | 'guided_entry'
  | 'word_cloud'
  | 'body_scan'
  | 'voice';

type ServerSessionState =
  | 'initiated'
  | 'input_received'
  | 'processing'
  | 'mirror_delivered'
  | 'confirmed'
  | 'path_selected'
  | 'path_in_progress'
  | 'completed'
  | 'abandoned'
  | 'error';

const ENTRY_TYPE_MAP: Record<EntryType, ServerEntryType> = {
  typed: 'open_prompt',
  scaffold: 'word_cloud',
  hybrid: 'guided_entry',
};

export function mapEntryType(clientType: EntryType): ServerEntryType {
  return ENTRY_TYPE_MAP[clientType];
}

export function mapServerStateToScreen(
  serverState: ServerSessionState,
): ReflectionStateName | null {
  switch (serverState) {
    case 'initiated':
    case 'input_received':
      return 'idle';
    case 'processing':
      return 'processing';
    case 'mirror_delivered':
      return 'mirror';
    case 'confirmed':
    case 'path_selected':
    case 'path_in_progress':
      return 'path-selection';
    case 'error':
      return 'error';
    case 'completed':
    case 'abandoned':
      return null; // terminal — no screen to show
    default:
      return null;
  }
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Rate limit')) {
      return "You've been reflecting a lot. Take a moment and come back soon.";
    }
    if (error.message.includes('Not authenticated')) {
      return 'Your session expired. Please sign in again.';
    }
    return 'Something went wrong. You can try again when you are ready.';
  }
  return 'Something unexpected happened.';
}
