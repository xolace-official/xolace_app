import { Stack } from 'expo-router';


/**
 * Provides the navigation layout used by protected routes.
 *
 * @returns A Stack element configured with headers hidden and a transparent content background.
 */

export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
