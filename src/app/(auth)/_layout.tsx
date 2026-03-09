import { Stack } from 'expo-router';

/**
 * Layout component for authentication routes that provides a Stack navigator with the header hidden, fade animation, and transparent background.
 *
 * @returns The Stack layout containing the "auth" screen.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="auth" />
    </Stack>
  );
}
