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
  const selectPathMutation = useMutation(api.sessions.selectPath);
  const startPathMutation = useMutation(api.sessions.startPath);
  const completePathMutation = useMutation(api.sessions.completePath);
  const busyRef = useRef(false);

  const sessionId = activeSession?._id ?? null;
  const session = activeSession;
  const isLoading = activeSession === undefined;

  /**
   * Select a path and immediately start it.
   * Called on mount from path screens.
   */
  const selectAndStartPath = useCallback(
    async (
      pathChosen: 'solo' | 'peers',
      exerciseId?: Id<'exercises'>,
    ) => {
      if (!sessionId || busyRef.current) return;
      busyRef.current = true;
      try {
        // Only select if still in confirmed state
        if (session?.state === 'confirmed') {
          await selectPathMutation({ sessionId, pathChosen });
        }
        // Only start if now in path_selected state (or was already)
        if (
          session?.state === 'confirmed' ||
          session?.state === 'path_selected'
        ) {
          await startPathMutation({ sessionId, exerciseId });
        }
      } finally {
        busyRef.current = false;
      }
    },
    [sessionId, session?.state, selectPathMutation, startPathMutation],
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
    selectAndStartPath,
    completePath,
  };
}
