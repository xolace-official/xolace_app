/**
 * Explore screen — showcases what's included in the starter template.
 * Replace or extend this with your app's own content.
 */
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { AppText } from '@/components/shared/app-text';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + 16,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: 64,
      paddingBottom: 24,
    },
    default: {},
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInset={insets}
      contentContainerStyle={[{ flexDirection: 'row', justifyContent: 'center' }, contentPlatformStyle]}>
      <View className="grow bg-background" style={{ maxWidth: MaxContentWidth }}>
        <View className="gap-4 items-center px-6 py-16">
          <AppText className="text-3xl font-semibold leading-[44px] text-foreground">Explore</AppText>
          <AppText className="text-center text-foreground">
            What&apos;s included in this starter{'\n'}and how to make it yours.
          </AppText>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable className="active:opacity-70">
              <View className="flex-row px-6 py-2 rounded-[32px] justify-center gap-1 items-center bg-background-element">
                <AppText className="text-sm text-blue-500">Expo documentation</AppText>
                <SymbolView
                  tintColor="var(--text)"
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </View>
            </Pressable>
          </ExternalLink>
        </View>

        <View className="gap-8 px-6 pt-4">
          <Collapsible title="File-based routing">
            <AppText className="text-sm font-medium text-foreground">
              Routes live in <AppText className="font-mono text-xs font-medium">src/app/</AppText> — each file maps to a screen.
              The layout in <AppText className="font-mono text-xs font-medium">src/app/_layout.tsx</AppText> sets up the
              tab navigator with native tabs on iOS/Android.
            </AppText>
            <AppText className="text-sm font-medium text-foreground">
              Add new tabs by creating a route file and adding an entry to{' '}
              <AppText className="font-mono text-xs font-medium">src/constants/tabs.ts</AppText>.
            </AppText>
            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <AppText className="text-sm text-[#3c87f7] leading-[30px]">Learn more</AppText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Multi-theme system">
            <AppText className="text-sm font-medium text-foreground">
              This starter includes multiple color themes (Default, Lavender, Mint, Sky) with light and dark
              variants each. Themes are defined as CSS files in{' '}
              <AppText className="font-mono text-xs font-medium">src/themes/</AppText>.
            </AppText>
            <AppText className="text-sm font-medium text-foreground">
              Switch themes using <AppText className="font-mono text-xs font-medium">useAppTheme()</AppText> from{' '}
              <AppText className="font-mono text-xs font-medium">@/context/app-theme-context</AppText>. Try the Theme
              tab to see it in action.
            </AppText>
            <ExternalLink href="https://uniwind.dev">
              <AppText className="text-sm text-[#3c87f7] leading-[30px]">Uniwind docs</AppText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="HeroUI Native components">
            <AppText className="text-sm font-medium text-foreground">
              HeroUI Native provides ready-to-use UI components that work with the theme system.
              The provider is set up in{' '}
              <AppText className="font-mono text-xs font-medium">src/providers/root-provider.tsx</AppText>.
            </AppText>
            <AppText className="text-sm font-medium text-foreground">
              Use <AppText className="font-mono text-xs font-medium">useThemeColor()</AppText> from heroui-native
              when you need theme color values in JavaScript.
            </AppText>
            <ExternalLink href="https://v3.heroui.com/docs/native/getting-started">
              <AppText className="text-sm text-[#3c87f7] leading-[30px]">HeroUI Native docs</AppText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Android, iOS, and web support">
            <View className="items-center bg-background-element rounded-xl p-4">
              <AppText className="text-sm font-medium text-foreground">
                You can open this project on Android, iOS, and the web. To open the web version,
                press <AppText className="text-sm font-bold">w</AppText> in the terminal running this
                project.
              </AppText>
              <Image
                source={require('@/assets/images/tutorial-web.png')}
                className="w-full aspect-296/171 rounded-2xl mt-2"
              />
            </View>
          </Collapsible>

          <Collapsible title="State management">
            <AppText className="text-sm font-medium text-foreground">
              Zustand is set up in <AppText className="font-mono text-xs font-medium">src/store/store.ts</AppText> with
              example slices for auth, theme, and preferences. State is persisted across app
              restarts using <AppText className="font-mono text-xs font-medium">expo-sqlite/kv-store</AppText> on native
              and localStorage on web.
            </AppText>
            <AppText className="text-sm font-medium text-foreground">
              Replace or remove the example slices to fit your app&apos;s needs.
            </AppText>
            <ExternalLink href="https://zustand.docs.pmnd.rs/">
              <AppText className="text-sm text-[#3c87f7] leading-[30px]">Zustand docs</AppText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Images">
            <AppText className="text-sm font-medium text-foreground">
              Use <AppText className="font-mono text-xs font-medium">expo-image</AppText> for all images — never{' '}
              <AppText className="font-mono text-xs font-medium">Image</AppText> from react-native. For static images,
              use the <AppText className="font-mono text-xs font-medium">@2x</AppText> and{' '}
              <AppText className="font-mono text-xs font-medium">@3x</AppText> suffixes for different screen densities.
            </AppText>
            <Image
              source={require('@/assets/images/react-logo.png')}
              className="w-[100px] h-[100px] self-center"
            />
            <ExternalLink href="https://reactnative.dev/docs/images">
              <AppText className="text-sm text-[#3c87f7] leading-[30px]">Learn more</AppText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Animations">
            <AppText className="text-sm font-medium text-foreground">
              This template uses <AppText className="font-mono text-xs font-medium">react-native-reanimated</AppText> for
              animations. These collapsibles use <AppText className="font-mono text-xs font-medium">FadeIn</AppText>, and the
              home screen icon uses keyframe animations. See{' '}
              <AppText className="font-mono text-xs font-medium">src/components/animated-icon.tsx</AppText> for an example.
            </AppText>
          </Collapsible>
        </View>
        {Platform.OS === 'web' && <WebBadge />}
      </View>
    </ScrollView>
  );
}

