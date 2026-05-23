import { Stack } from 'expo-router';

/**
 * Layout component that configures the onboarding navigation stack.
 *
 * Renders a Stack configured for the onboarding flow with the header hidden,
 * fade animation, and a transparent background; exposes the "index" and "frame" screens.
 *
 * @returns A React element containing the configured onboarding Stack
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
      <Stack.Screen name="frame" />
    </Stack>
  );
}
