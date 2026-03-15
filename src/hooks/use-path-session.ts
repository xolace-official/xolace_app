import { useCallback, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

/**
 * Lightweight hook for path screens (peers, solo).
 * Gets the active session and exposes path mutations.
 */
export function usePathSession() {
  const activeSession = useQuery(api.sessions.getActive);
  const startPathMutation = useMutation(api.sessions.startPath);
  const completePathMutation = useMutation(api.sessions.completePath);
  const busyRef = useRef(false);

  const sessionId = activeSession?._id ?? null;
  const session = activeSession;
  const isLoading = activeSession === undefined;

  /**
   * Start the path. Called on mount from path screens.
   * selectPath was already called from PathSelectionState before navigation.
   */
  const startPath = useCallback(
    async (exerciseId?: Id<'exercises'>) => {
      if (!sessionId || busyRef.current) return;
      if (session?.state !== 'path_selected') return;
      busyRef.current = true;
      try {
        await startPathMutation({ sessionId, exerciseId });
      } finally {
        busyRef.current = false;
      }
    },
    [sessionId, session?.state, startPathMutation],
  );

  /**
   * Complete the current path and mark the session as completed.
   */
  const completePath = useCallback(
    async (pathCompleted: boolean, contributedReflection?: boolean) => {
      if (!sessionId || busyRef.current) return;
      busyRef.current = true;
      try {
        await completePathMutation({
          sessionId,
          pathCompleted,
          contributedReflection,
        });
      } finally {
        busyRef.current = false;
      }
    },
    [sessionId, completePathMutation],
  );

  return {
    sessionId,
    session,
    isLoading,
    startPath,
    completePath,
  };
}
