/**
 * Root layout — wraps the entire app in providers and renders the tab navigation.
 *
 * Provider order: RootProvider (gestures, keyboard, theme, HeroUI) → ThemeProvider (React Navigation).
 * See src/providers/root-provider.tsx to add your own providers (auth, analytics, etc.).
 */
import '@/src/global.css';
import '@/src/lib/theme-bootstrap';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Stack, usePathname, useGlobalSearchParams } from 'expo-router';
import { useUniwind } from 'uniwind'
import * as SplashScreen from 'expo-splash-screen';
import { useConvexAuth } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts
} from '@expo-google-fonts/space-grotesk';

import { RootProvider } from '@/src/providers/root-provider';
import { useAppStore } from '@/src/store/store';
import { useOtaUpdate } from '@/src/helpers/hooks/use-ota-update';
import { useVersionCheck } from '@/src/helpers/hooks/use-version-check';
import { FullRippleLoader } from '@/src/components/shared/loader/ripple/full-ripple-loader';

SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const introSeen = useAppStore((s) => s.introSeen);
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const posthog = usePostHog();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        path: typeof params.path === 'string' ? params.path : null,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params, posthog]);

  if (isAuthLoading) return <FullRippleLoader />;
  return (
        <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Protected guard={!introSeen}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={introSeen && !isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={introSeen && isAuthenticated}>
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack.Protected>

    </Stack>
  )
}

/**
 * Wraps the app content with root providers and supplies a navigation theme based on the current Uniwind theme.
 *
 * The component retrieves the active theme from `useUniwind` and passes `DarkTheme` when the theme equals `"dark"`, otherwise `DefaultTheme`. It also establishes the `RootProvider` context before rendering the app content.
 *
 * @returns The root layout element that provides app-wide context and a navigation theme.
 */
export default function RootLayout() {
  useVersionCheck();
  useOtaUpdate();
  const { theme } = useUniwind()
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }
  return (
    <RootProvider>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppContent />
      </ThemeProvider>
    </RootProvider>
  );
}
