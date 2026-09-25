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
        screenOptions={largeHeaderOptions}
      >
        <Stack.Screen name="index" options={BROWSE_OPTIONS} />
        <Stack.Screen name="list" options={SUB_OPTIONS} />
        <Stack.Screen name="topics" options={{ ...SUB_OPTIONS, title: 'Topics' }} />
        <Stack.Screen name="topic/[slug]" options={SUB_OPTIONS} />
        {/* Lantern (#409): the Library home keeps a large title of its own */}
        <Stack.Screen name="library/index" options={{ title: 'Lantern', headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="library/hub/[slug]" options={SUB_OPTIONS} />
        <Stack.Screen name="library/kind/[kind]" options={SUB_OPTIONS} />
        <Stack.Screen name="library/subject/[slug]" options={SUB_OPTIONS} />
        <Stack.Screen name="library/subjects" options={{ ...SUB_OPTIONS, title: 'Subjects' }} />
      </Stack>
    </View>
  );
}
