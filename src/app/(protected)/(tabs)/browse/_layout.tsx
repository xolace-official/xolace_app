import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useLargeHeaderOptions } from '@/src/lib/navigation-options';

const BROWSE_OPTIONS = { title: 'Browse' };
// Sub-screens keep the regular (non-large) title; the hub owns the large one.
const SUB_OPTIONS = { title: '', headerLargeTitle: false, headerBackButtonDisplayMode: 'minimal' as const };

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
        <Stack.Screen name="list" options={SUB_OPTIONS} />
        <Stack.Screen name="topics" options={{ ...SUB_OPTIONS, title: 'Topics' }} />
        <Stack.Screen name="topic/[slug]" options={SUB_OPTIONS} />
      </Stack>
    </View>
  );
}
