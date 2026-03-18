import { useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { usePathSession } from '@/hooks/use-path-session';

/**
 * Encapsulates session completion logic for the session-end screen.
 *
 * Provides `dismiss` and `haveMore` callbacks that complete the active session
 * (optionally recording a contribution) then navigate back to the home screen.
 * Automatically navigates back if no active session is found after loading.
 */
export function useSessionEnd() {
  const router = useRouter();
  const { sessionId, isLoading, completePath } = usePathSession();
  const busyRef = useRef(false);

  // Guard: if no active session after loading, bail out
  useEffect(() => {
    if (!isLoading && !sessionId) {
      router.back();
    }
  }, [isLoading, sessionId, router]);

  const dismiss = useCallback(
    async (contributedReflection?: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        await completePath(true, contributedReflection);
        router.back();
      } finally {
        busyRef.current = false;
      }
    },
    [completePath, router],
  );

  const haveMore = useCallback(
    async (contributedReflection?: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        await completePath(true, contributedReflection);
        router.back();
      } finally {
        busyRef.current = false;
      }
    },
    [completePath, router],
  );

  return { sessionId, isLoading, dismiss, haveMore };
}
