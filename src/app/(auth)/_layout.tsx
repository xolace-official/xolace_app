import { Stack } from 'expo-router';

/**
 * Layout component for authentication routes that provides a Stack navigator with the header hidden, fade animation, and transparent background.
 *
 * @returns The Stack layout containing the "auth" screen.
 */
const SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'fade' as const,
  contentStyle: { backgroundColor: 'transparent' },
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="auth" />
    </Stack>
  );
}
