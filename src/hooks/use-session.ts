import { useState, useEffect, useCallback } from 'react';
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

export function useSession() {
  const [sessionId, setSessionId] = useState<Id<'sessions'> | null>(null);

  // Only check for active sessions when we don't already have one
  const activeSession = useQuery(
    api.sessions.getActive,
    sessionId ? 'skip' : undefined,
  );

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
  const completeSessionMutation = useMutation(api.sessions.completeSession);
  const submitFeedbackMutation = useMutation(api.sessionTurns.submitFeedback);
  const abandonMutation = useMutation(api.sessions.abandon);
  const retryMutation = useMutation(api.sessions.retrySession);

  // --- Resume: pick up an active session on mount ---
  useEffect(() => {
    if (activeSession && !sessionId) {
      setSessionId(activeSession._id);
    }
  }, [activeSession, sessionId]);

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
      setSessionId(newSessionId);

      // TODO: encrypt rawText before submission
      await submitInputMutation({
        sessionId: newSessionId,
        rawInputEncrypted: rawText,
        rawInputLength: rawText.length,
        inputDuration,
        freezeOccurred,
        freezeDuration,
      });
    },
    [initiateMutation, submitInputMutation],
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

  const submitRefinement = useCallback(
    async (
      userFeedback: 'not_quite' | 'say_more',
      userInputEncrypted?: string,
    ) => {
      if (!sessionId) return;
      // TODO: encrypt userInputEncrypted before submission
      await submitFeedbackMutation({
        sessionId,
        userFeedback,
        userInputEncrypted,
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
    if (!sessionId) return;
    await retryMutation({ sessionId });
  }, [sessionId, retryMutation]);

  const resetSession = useCallback(() => {
    setSessionId(null);
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
    submitRefinement,
    abandon,
    retry,
    resetSession,
  };
}
