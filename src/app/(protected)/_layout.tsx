import { Stack } from 'expo-router';
import { useNotifications } from '@/src/lib/use-notifications';

/**
 * Provides the navigation layout used by protected routes.
 * Initializes push notification registration for authenticated users.
 */
export default function ProtectedLayout() {
  useNotifications();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="sit-with-this" options={{ gestureEnabled: false }} />
      <Stack.Screen name="peer-reflections" options={{ gestureEnabled: false }} />
      <Stack.Screen name="session-end" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
