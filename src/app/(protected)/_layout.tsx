import { Stack } from 'expo-router';
import { useNotifications } from '@/src/lib/use-notifications';

/**
 * Provides the navigation layout used by protected routes.
 * Initializes push notification registration for authenticated users.
 */
const SCREEN_OPTIONS = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

const NO_GESTURE = { gestureEnabled: false };

export default function ProtectedLayout() {
  useNotifications();

  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sit-with-this" options={NO_GESTURE} />
      <Stack.Screen name="peer-reflections" options={NO_GESTURE} />
      <Stack.Screen name="session-end" options={NO_GESTURE} />
      <Stack.Screen name="crisis-resources" options={NO_GESTURE} />
      <Stack.Screen name="trusted-bridge" />
      <Stack.Screen name="quotes/index" />
    </Stack>
  );
}
