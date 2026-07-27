import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useLargeHeaderOptions } from '@/src/lib/navigation-options';

/**
 * Each tab owns a stack so its title is a real navigation bar — a plain View
 * inside a native tab gets no safe-area inset (only the first nested scroll
 * view does), which is what put "Connect" under the status bar.
 */
const CONNECT_OPTIONS = { title: 'Connect' };

export default function ConnectLayout() {
  const largeHeaderOptions = useLargeHeaderOptions();

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          ...largeHeaderOptions,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={CONNECT_OPTIONS} />
      </Stack>
    </View>
  );
}
