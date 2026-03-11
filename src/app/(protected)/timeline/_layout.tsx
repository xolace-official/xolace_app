import { Stack } from 'expo-router';


/**
 *
 * @returns A Stack element configured with headers hidden and a transparent content background.
 */

export default function TimelineLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
