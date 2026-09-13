import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useLargeHeaderOptions } from '@/src/lib/navigation-options';

const BROWSE_OPTIONS = { title: 'Browse' };

export default function BrowseLayout() {
  const largeHeaderOptions = useLargeHeaderOptions();

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          ...largeHeaderOptions,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={BROWSE_OPTIONS} />
      </Stack>
    </View>
  );
}
