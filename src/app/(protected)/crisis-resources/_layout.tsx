import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { useLargeHeaderOptions } from '@/src/lib/navigation-options';

export default function CrisisResourcesLayout() {
  const router = useRouter();
  const largeHeaderOptions = useLargeHeaderOptions();
  const tintColor = useThemeColor('foreground') as string;

  const renderBackButton = () => (
    <PressableFeedback onPress={() => router.back()} hitSlop={8}>
      <SymbolView
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={20}
        tintColor={tintColor}
      />
    </PressableFeedback>
  );

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          ...largeHeaderOptions,
          headerLeft: renderBackButton,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Get Help Now' }} />
      </Stack>
    </View>
  );
}
