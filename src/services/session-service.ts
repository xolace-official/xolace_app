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

/**
 * Translate a client entry type into the corresponding server-side entry type.
 *
 * @param clientType - The client-facing entry type to map
 * @returns The corresponding `ServerEntryType` value from `ENTRY_TYPE_MAP`
 */
export function mapEntryType(clientType: EntryType): ServerEntryType {
  return ENTRY_TYPE_MAP[clientType];
}

/**
 * Map a server session state to the corresponding UI reflection screen name.
 *
 * @param serverState - The server session state to translate
 * @returns The corresponding `ReflectionStateName` for `serverState`, or `null` for terminal or unrecognized states
 */
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

/**
 * Produce a user-facing message derived from an error value.
 *
 * @param error - The value to inspect for generating a friendly message
 * @returns A string appropriate for the error:
 * - A rate-limit hint when the error message contains 'Rate limit'
 * - A session-expired prompt when the error message contains 'Not authenticated'
 * - A generic retry prompt for other Error instances
 * - A generic unexpected-error message for non-Error inputs
 */
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
