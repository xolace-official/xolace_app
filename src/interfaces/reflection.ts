export type UserVariant =
  | { kind: 'first-time' }
  | { kind: 'returning' }
  | { kind: 'active'; dayCount: number };

export type ReflectionStateName =
  | 'idle'
  | 'typing'
  | 'typing-nudge'
  | 'processing'
  | 'mirror'
  | 'clarify'
  | 'gave-up'
  | 'path-selection';

export type ReflectionAction =
  | { type: 'TAP_INPUT' }
  | { type: 'TEXT_CHANGE'; text: string }
  | { type: 'PAUSE_TIMEOUT' }
  | { type: 'RESUME_TYPING' }
  | { type: 'SUBMIT' }
  | { type: 'MIRROR_RECEIVED'; mirror: string }
  | { type: 'THATS_IT' }
  | { type: 'NOT_QUITE' }
  | { type: 'SAY_MORE' }
  | { type: 'CLARIFY_TEXT_CHANGE'; text: string }
  | { type: 'RESET' };

export interface ReflectionState {
  screen: ReflectionStateName;
  entryText: string;
  clarifyText: string;
  mirrorResponse: string;
  clarifyCount: number;
  userVariant: UserVariant;
}

export interface MirrorResponse {
  text: string;
}
