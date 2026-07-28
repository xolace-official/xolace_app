import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useLargeHeaderOptions } from '@/src/lib/navigation-options';

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
