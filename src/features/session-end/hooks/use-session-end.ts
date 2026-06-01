import { useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { api } from '@/convex/_generated/api';
import { usePathSession } from '@/src/features/sit-with-this/hooks/use-path-session';

/**
 * Prepare and expose session completion and navigation utilities for the session-end screen.
 *
 * Exposes `dismiss` and `haveMore` callbacks that complete the active session (optionally recording
 * whether the user contributed a reflection) and then navigate to the home screen. Automatically
 * navigates home if loading finishes with no active session. Also provides the active `sessionId`,
 * a loading flag, the session's distilled text (or `null`), and the user's `contributeByDefault`
 * preference (defaults to `false` while the preference is unavailable).
 *
 * @returns An object containing:
 * - `sessionId` — the current session identifier, if any
 * - `isLoading` — `true` while session data is loading
 * - `distilledText` — the session's distilled text, or `null` if unavailable
 * - `contributeByDefault` — whether contributions are enabled by default (defaults to `false`)
 * - `dismiss` — callback accepting an optional `contributedReflection` boolean to complete the session and navigate home
 * - `haveMore` — callback accepting an optional `contributedReflection` boolean to complete the session and navigate home
 */
export function useSessionEnd() {
  const router = useRouter();
  const { sessionId, session, isLoading, completePath } = usePathSession();
  const contributeByDefaultQuery = useQuery(api.preferences.getContributeByDefault);
  const sessionCountQuery = useQuery(api.users.getSessionCount);
  const posthog = usePostHog();
  const busyRef = useRef(false);
  const navigatedRef = useRef(false);

  const navigateHome = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace('/');
  }, [router]);

  // Guard: if no active session after loading (e.g. session abandoned externally)
  useEffect(() => {
    if (!isLoading && !sessionId) {
      navigateHome();
    }
  }, [isLoading, sessionId, navigateHome]);

  const dismiss = async (
    contributedReflection?: boolean,
    postSessionMood?: 'lighter' | 'same' | 'heavier' | 'unsure',
  ) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const ok = await completePath(true, contributedReflection, postSessionMood).finally(
      () => {
        busyRef.current = false;
      },
    );
    if (ok) {
      posthog.capture('session_completed', {
        post_session_mood: postSessionMood ?? null,
        contributed_reflection: contributedReflection ?? false,
        action: 'dismiss',
      });
      navigateHome();
    }
  };

  const haveMore = async (
    contributedReflection?: boolean,
    postSessionMood?: 'lighter' | 'same' | 'heavier' | 'unsure',
  ) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const ok = await completePath(true, contributedReflection, postSessionMood).finally(
      () => {
        busyRef.current = false;
      },
    );
    if (ok) {
      posthog.capture('session_completed', {
        post_session_mood: postSessionMood ?? null,
        contributed_reflection: contributedReflection ?? false,
        action: 'have_more',
      });
      navigateHome();
    }
  };

  const distilledText = (session as { distilledText?: string } | undefined)
    ?.distilledText ?? null;
  const contributeByDefault = contributeByDefaultQuery ?? false;
  const sessionCount = sessionCountQuery ?? 0;

  return { sessionId, isLoading, distilledText, contributeByDefault, sessionCount, dismiss, haveMore };
}
