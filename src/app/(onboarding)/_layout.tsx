import { Stack } from 'expo-router';

import { useAppStore } from '@/src/store/store';

/**
 * Onboarding stack: the promise, then the carousel-to-auth screen.
 *
 * Since #199 collapsed the root guards to two groups, this stack owns the
 * whole signed-out experience — and `introSeen` lives here rather than at the
 * root. A returning signed-out user has already watched the intro, so they
 * mount straight on `auth-onboarding` (which is the sign-in surface now)
 * instead of replaying the promise.
 */
const SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'fade' as const,
  contentStyle: { backgroundColor: 'transparent' },
};

export default function OnboardingLayout() {
  // Read once at mount: `initialRouteName` is only consulted when the
  // navigator first mounts, and flipping it mid-session would be a no-op that
  // reads like a bug.
  const introSeen = useAppStore.getState().introSeen;

  return (
    <Stack screenOptions={SCREEN_OPTIONS} initialRouteName={introSeen ? 'auth-onboarding' : 'index'}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth-onboarding" />
    </Stack>
  );
}
