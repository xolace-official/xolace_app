import { useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EntryType } from '@/interfaces/reflection';
import { mapEntryType } from '@/services/session-service';

// States where turns are relevant (mirror has been delivered at least once)
const TURN_RELEVANT_STATES = new Set([
  'mirror_delivered',
  'confirmed',
  'path_selected',
  'path_in_progress',
  'completed',
]);

/**
 * Maintain a client-side session identifier and expose server-backed session data, derived state, and actions to drive a session lifecycle.
 *
 * @returns An object with session identifiers and state (`sessionId`, `session`, `serverState`, `mirrorText`, `errorMessage`, `isLoading`), turn data (`turns`, `turnsCount`), and action creators for the session lifecycle:
 * - `initiateAndSubmit(rawText, entryType, inputDuration?, freezeOccurred?, freezeDuration?)`
 * - `confirmMirror(confirmationState)`
 * - `completeAsExit()`
 * - `selectPath(pathChosen)`
 * - `startPath(exerciseId?)`
 * - `completePath(pathCompleted, contributedReflection?)`
 * - `submitRefinement(userFeedback, additionalRawText?)`
 * - `abandon()`
 * - `retry()`
 * - `resetSession()`
 */
export function useSession() {
  const [localSessionId, setLocalSessionId] = useState<Id<'sessions'> | null>(null);
  const [lastRawText, setLastRawText] = useState<string | null>(null);

  // Derive sessionId: prefer explicitly-set local ID, fall back to server active session
  const activeSession = useQuery(
    api.sessions.getActive,
    localSessionId ? 'skip' : undefined,
  );
  const sessionId = localSessionId ?? activeSession?._id ?? null;

  const session = useQuery(
    api.sessions.getById,
    sessionId ? { sessionId } : 'skip',
  );

  // Only subscribe to turns when the session is in a state where turns matter
  const shouldQueryTurns =
    sessionId != null &&
    session?.state != null &&
    TURN_RELEVANT_STATES.has(session.state);

  const turns = useQuery(
    api.sessionTurns.listBySession,
    shouldQueryTurns ? { sessionId: sessionId! } : 'skip',
  );

  // --- Mutations ---
  const initiateMutation = useMutation(api.sessions.initiate);
  const submitInputMutation = useMutation(api.sessions.submitInput);
  const confirmMirrorMutation = useMutation(api.sessions.confirmMirror);
  const selectPathMutation = useMutation(api.sessions.selectPath);
  const startPathMutation = useMutation(api.sessions.startPath);
  const completePathMutation = useMutation(api.sessions.completePath);
  const completeSessionMutation = useMutation(api.sessions.completeSession);
  const submitFeedbackMutation = useMutation(api.sessionTurns.submitFeedback);
  const abandonMutation = useMutation(api.sessions.abandon);
  const retryMutation = useMutation(api.sessions.retrySession);

  // --- Derived state ---
  const turnsCount = turns?.length ?? 0;
  const isLoading = !sessionId && activeSession === undefined;
  const serverState = session?.state ?? null;
  const mirrorText = session?.mirrorText ?? null;
  const errorMessage = session?.errorMessage ?? null;

  // --- Actions ---

  const initiateAndSubmit = useCallback(
    async (
      rawText: string,
      entryType: EntryType,
      inputDuration?: number,
      freezeOccurred = false,
      freezeDuration?: number,
    ) => {
      const serverEntryType = mapEntryType(entryType);
      const newSessionId = await initiateMutation({
        entryType: serverEntryType,
      });
      setLocalSessionId(newSessionId);
      setLastRawText(rawText);

      try {
        // TODO: encrypt rawText before submission
        await submitInputMutation({
          sessionId: newSessionId,
          rawInputEncrypted: rawText, // TODO: replace with encrypted version
          rawText,
          rawInputLength: rawText.length,
          inputDuration,
          freezeOccurred,
          freezeDuration,
        });
      } catch (error) {
        // Roll back the dangling initiated session
        try {
          await abandonMutation({ sessionId: newSessionId });
        } catch {
          // best-effort cleanup
        }
        setLocalSessionId(null);
        throw error;
      }
    },
    [initiateMutation, submitInputMutation, abandonMutation],
  );

  const confirmMirror = useCallback(
    async (confirmationState: 'confirmed' | 'refined' | 'gave_up') => {
      if (!sessionId) return;
      await confirmMirrorMutation({ sessionId, confirmationState });
    },
    [sessionId, confirmMirrorMutation],
  );

  const completeAsExit = useCallback(async () => {
    if (!sessionId) return;
    await completeSessionMutation({ sessionId });
  }, [sessionId, completeSessionMutation]);

  const selectPath = useCallback(
    async (pathChosen: 'solo' | 'peers' | 'exit') => {
      if (!sessionId) return;
      await selectPathMutation({ sessionId, pathChosen });
    },
    [sessionId, selectPathMutation],
  );

  const startPath = useCallback(
    async (exerciseId?: string) => {
      if (!sessionId) return;
      await startPathMutation({
        sessionId,
        exerciseId: exerciseId as Id<'exercises'> | undefined,
      });
    },
    [sessionId, startPathMutation],
  );

  const completePath = useCallback(
    async (pathCompleted: boolean, contributedReflection?: boolean) => {
      if (!sessionId) return;
      await completePathMutation({
        sessionId,
        pathCompleted,
        contributedReflection,
      });
    },
    [sessionId, completePathMutation],
  );

  const submitRefinement = useCallback(
    async (
      userFeedback: 'not_quite' | 'say_more',
      additionalRawText?: string,
    ) => {
      if (!sessionId) return;
      // TODO: encrypt additionalRawText before submission
      await submitFeedbackMutation({
        sessionId,
        userFeedback,
        userInputEncrypted: additionalRawText, // TODO: replace with encrypted version
        additionalRawText,
      });
    },
    [sessionId, submitFeedbackMutation],
  );

  const abandon = useCallback(async () => {
    if (!sessionId) return;
    try {
      await abandonMutation({ sessionId });
    } catch {
      // best-effort — session may already be terminal
    }
  }, [sessionId, abandonMutation]);

  const retry = useCallback(async () => {
    if (!sessionId || !lastRawText) return;
    await retryMutation({ sessionId, rawText: lastRawText });
  }, [sessionId, lastRawText, retryMutation]);

  const resetSession = useCallback(() => {
    setLocalSessionId(null);
    setLastRawText(null);
  }, []);

  return {
    sessionId,
    session,
    turns,
    turnsCount,
    serverState,
    mirrorText,
    errorMessage,
    isLoading,
    initiateAndSubmit,
    confirmMirror,
    completeAsExit,
    selectPath,
    startPath,
    completePath,
    submitRefinement,
    abandon,
    retry,
    resetSession,
  };
}
