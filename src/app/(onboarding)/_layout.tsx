import { Stack } from 'expo-router';

/**
 * Onboarding stack: the promise, then the carousel-to-auth screen.
 *
 * Since #199 collapsed the root guards to two groups, this stack owns the
 * whole signed-out experience — and `introSeen` lives here rather than at the
 * root. A returning signed-out user has already watched the intro; `index`
 * redirects straight to `auth-onboarding` (the sign-in surface) instead of
 * replaying the promise — see `(onboarding)/index.tsx`. (Expo Router's own
 * initial-route resolution for a group doesn't honor a runtime-computed
 * `<Stack initialRouteName>` / `unstable_settings`, so a redirect from the
 * screen itself is the reliable way to skip it.)
 */
const SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'fade' as const,
  contentStyle: { backgroundColor: 'transparent' },
};

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth-onboarding" />
    </Stack>
  );
}
