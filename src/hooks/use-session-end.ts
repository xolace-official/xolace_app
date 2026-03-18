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
  const navigatedRef = useRef(false);

  const navigateHome = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  // Guard: if no active session after loading (e.g. session abandoned externally)
  useEffect(() => {
    if (!isLoading && !sessionId) {
      navigateHome();
    }
  }, [isLoading, sessionId, navigateHome]);

  const dismiss = useCallback(
    async (contributedReflection?: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      await completePath(true, contributedReflection);
      busyRef.current = false;
      navigateHome();
    },
    [completePath, navigateHome],
  );

  const haveMore = useCallback(
    async (contributedReflection?: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      await completePath(true, contributedReflection);
      busyRef.current = false;
      navigateHome();
    },
    [completePath, navigateHome],
  );

  return { sessionId, isLoading, dismiss, haveMore };
}
