/**
 * The one way into Xolace for a signed-out user (#204): the story carousel
 * that expands upward into sign-in. Replaces the old two-screen path — the
 * `FrameScreenV2` step list followed by a separate `(auth)/auth` screen.
 *
 * Reaching this screen is what "the intro has been seen" means now. `introSeen`
 * no longer gates a route group at the root (#199 collapsed those to two); it
 * only decides whether the onboarding stack starts on the promise or lands
 * straight here, so a returning signed-out user doesn't replay the intro.
 */
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { usePostHog } from 'posthog-react-native';

import { useAppStore } from '@/src/store/store';
import { AuthOnboardingShell } from '@/src/features/onboarding/components/auth-onboarding/auth-onboarding-shell';

export const AuthOnboardingScreen = () => {
  const setIntroSeen = useAppStore((s) => s.setIntroSeen);
  const posthog = usePostHog();
  const hasMarkedIntro = useRef(false);

  useEffect(() => {
    if (hasMarkedIntro.current) return;
    hasMarkedIntro.current = true;
    // Only a first pass through the promise completes the intro — a returning
    // signed-out user mounts here directly and must not re-fire the event.
    if (!useAppStore.getState().introSeen) {
      posthog?.capture('onboarding_completed');
      setIntroSeen(true);
    }
  }, [posthog, setIntroSeen]);

  return (
    <>
      <StatusBar hidden />
      <AuthOnboardingShell />
    </>
  );
};
