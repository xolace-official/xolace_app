import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useLargeHeaderOptions } from '@/src/lib/navigation-options';

const DISCOVERY_OPTIONS = { title: 'Discovery' };

export default function DiscoveryLayout() {
  const largeHeaderOptions = useLargeHeaderOptions();

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          ...largeHeaderOptions,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={DISCOVERY_OPTIONS} />
      </Stack>
    </View>
  );
}
