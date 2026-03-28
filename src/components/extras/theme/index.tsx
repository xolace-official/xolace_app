/**
 * Theme showcase screen — demonstrates multi-theme switching with HeroUI Native components.
 *
 * This is an example screen. You can:
 * - Remove it entirely if your app doesn't need a theme picker
 * - Use it as reference for how to integrate useAppTheme() and theme selection UI
 * - Extend availableThemes below when you add new color themes
 */
import { useHeaderHeight } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from 'heroui-native';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppTheme } from '@/context/app-theme-context';

import { CardContent } from '@/components/examples/themes-content/card-content';
import {TextInputContent} from '@/components/examples/themes-content/text-input-content';

type ThemeOption = {
  id: string;
  name: string;
  lightVariant: string;
  darkVariant: string;
};

/** Add your custom themes here. Each needs an id, display name, and both light/dark variant names. */
const availableThemes: ThemeOption[] = [
  {
    id: 'default',
    name: 'Default',
    lightVariant: 'light',
    darkVariant: 'dark',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    lightVariant: 'lavender-light',
    darkVariant: 'lavender-dark',
  },
  {
    id: 'mint',
    name: 'Mint',
    lightVariant: 'mint-light',
    darkVariant: 'mint-dark',
  },
  {
    id: 'sky',
    name: 'Sky',
    lightVariant: 'sky-light',
    darkVariant: 'sky-dark',
  },
];

/** Gradient colors for the theme picker circles. Add an entry for each custom theme. */
const themeGradients = {
  default: ['#5DA2E7', '#0900FF'] as [string, string],
  lavender: ['#EF84F6', '#7B00FF'] as [string, string],
  mint: ['#52DEBE', '#208976'] as [string, string],
  sky: ['#5DD6E7', '#0062FF'] as [string, string],
} as const satisfies Record<string, [string, string]>;

const ThemeCircle: React.FC<{
  theme: ThemeOption;
  isActive: boolean;
  onPress: () => void;
}> = ({ theme, isActive, onPress }) => {
  const themeColorAccent = useThemeColor('accent');
  const gradientColors =
    themeGradients[theme.id as keyof typeof themeGradients] ??
    themeGradients.default;

  return (
    <Pressable onPress={onPress} className="items-center">
      <View style={{ position: 'relative', padding: 4 }}>
        {/* Active ring */}
        {isActive && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              position: 'absolute',
              width: 68,
              height: 68,
              borderRadius: 34,
              borderWidth: 2,
              borderColor: themeColorAccent,
              top: 0,
              left: 0,
            }}
          />
        )}
        {/* Theme circle */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>
      </View>
      <Text className="text-xs mt-2 text-foreground font-medium">
        {theme.name}
      </Text>
    </Pressable>
  );
};

export default function Themes() {
  const { currentTheme, setTheme, isLight } = useAppTheme();
  const headerHeight = useHeaderHeight();

  const getCurrentThemeId = () => {
    if (currentTheme === 'light' || currentTheme === 'dark') return 'default';
    if (currentTheme.startsWith('lavender')) return 'lavender';
    if (currentTheme.startsWith('mint')) return 'mint';
    if (currentTheme.startsWith('sky')) return 'sky';
    return 'default';
  };

  const handleThemeSelect = (theme: ThemeOption) => {
    const variant = isLight ? theme.lightVariant : theme.darkVariant;
    setTheme(variant as any);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-12 px-5"
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingBottom: 12,
      }}
      bottomOffset={60}
    >
      <View className="flex-row justify-around pt-6">
        {availableThemes.map((theme) => (
          <ThemeCircle
            key={theme.id}
            theme={theme}
            isActive={getCurrentThemeId() === theme.id}
            onPress={() => handleThemeSelect(theme)}
          />
        ))}
      </View>
      <CardContent />
      {/* <SwitchContent />
      <CheckboxContent />
      <RadioGroupContent /> */}
      <TextInputContent />
    </KeyboardAwareScrollView>
  );
}
