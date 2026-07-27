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

/** Skipping a rating should feel like dismissing, not navigating away. */
const RATE_OPTIONS = { presentation: 'formSheet', sheetGrabberVisible: true } as const;

export default function ProtectedLayout() {
  useNotifications();

  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={NO_GESTURE} />
      <Stack.Screen name="sit-with-this" options={NO_GESTURE} />
      <Stack.Screen name="peer-reflections" options={NO_GESTURE} />
      <Stack.Screen name="session-end" options={NO_GESTURE} />
      <Stack.Screen name="crisis-resources" options={NO_GESTURE} />
      <Stack.Screen name="trusted-bridge" />
      <Stack.Screen
        name="voice-vent"
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="quotes/index" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="listener/[profileId]" />
      <Stack.Screen name="listener-setup" />
      {/* Sits outside the chat group on purpose — rating needs no Stream
          client, and a sheet keeps "skip" feeling like a dismissal. */}
      <Stack.Screen name="rate/[conversationId]" options={RATE_OPTIONS} />
    </Stack>
  );
}
