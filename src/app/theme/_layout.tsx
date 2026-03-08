import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useCallback } from 'react';
import { useThemeColor } from 'heroui-native';
import { useAppTheme } from '@/context/app-theme-context';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

export default function ThemeLayout() {
      const { isDark } = useAppTheme();
      const [themeColorForeground, themeColorBackground] = useThemeColor([
    'foreground',
    'background',
  ]);

    const _renderThemeToggle = useCallback(() => <ThemeToggle />, []);

  return (
    <View className="flex-1 bg-background">
      <Stack
      screenOptions={{
          headerTitleAlign: 'center',
          headerTransparent: true,
          headerBlurEffect: isDark ? 'dark' : 'light',
          headerTintColor: themeColorForeground,
          headerStyle: {
            backgroundColor: Platform.select({
              ios: undefined,
              android: themeColorBackground,
            }),
          },
          headerTitleStyle: {
            fontFamily: 'Inter_600SemiBold',
          },
          headerRight: _renderThemeToggle,
          headerBackButtonDisplayMode: 'generic',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
          contentStyle: {
            backgroundColor: themeColorBackground,
          },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </View>
  );
}