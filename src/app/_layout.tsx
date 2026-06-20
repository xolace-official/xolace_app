/**
 * Root layout — wraps the entire app in providers and renders the tab navigation.
 *
 * Provider order: RootProvider (gestures, keyboard, theme, HeroUI) → ThemeProvider (React Navigation).
 * See src/providers/root-provider.tsx to add your own providers (auth, analytics, etc.).
 */
import '@/src/global.css';
import '@/src/lib/theme-bootstrap';

import { Settings } from 'react-native-pulsar';


import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from 'react';
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
import { Observe, ObserveRoot, useObserve } from 'expo-observe';

import { RootProvider } from '@/src/providers/root-provider';
import { useAppStore } from '@/src/store/store';
import { UpdateBottomSheet, type UpdateBottomSheetMode } from '@/src/components/shared/update-bottom-sheet';
import { useOtaUpdate } from '@/src/helpers/hooks/use-ota-update';
import { useVersionCheck } from '@/src/helpers/hooks/use-version-check';
import { FullRippleLoader } from '@/src/components/shared/loader/ripple/full-ripple-loader';

// Per-route navigation metrics (cold_ttr / warm_ttr / per-route tti). Must run
// at module scope before any screen mounts — toggling it after mount throws.
Observe.configure({ integrations: { 'expo-router': true } });

SplashScreen.preventAutoHideAsync();

Settings.enableSound(false);
Settings.preloadPresets([
  'Herald',    // mirrorArrival — peak haptic, must be instant
  'Bloom',     // sessionComplete
  'Feather',   // gentlePresence, onboarding transitions
  'Propel',    // form submit
  'Strike',    // affirmativePress
  'Cascade',   // onboardingEntrance
  'Wobble',    // errorNotice, clarifyState mount
  'Peal',      // escalationState mount
  'Flick',     // carousel advance, textureSelect
  'Thud',      // menu open, homeEntrance
  'Chirp',     // resonanceToggle, lighter mood
  'Murmur',    // peerReflections mount, unsure mood
  'Breath',    // processingBreath fallback
]);

const NO_HEADER = { headerShown: false };

const AppContent = () => {
  const introSeen = useAppStore((s) => s.introSeen);
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const posthog = usePostHog();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);
  const { markInteractive } = useObserve();

  useEffect(() => {
    if (!isAuthLoading) {
      markInteractive();
    }
  }, [isAuthLoading, markInteractive]);

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
        <Stack screenOptions={NO_HEADER}>
      <Stack.Protected guard={!introSeen}>
        <Stack.Screen name="(onboarding)" options={NO_HEADER} />
      </Stack.Protected>
      <Stack.Protected guard={introSeen && !isAuthenticated}>
        <Stack.Screen name="(auth)" options={NO_HEADER} />
      </Stack.Protected>
      <Stack.Protected guard={introSeen && isAuthenticated}>
        <Stack.Screen name="(protected)" options={NO_HEADER} />
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
function RootLayout() {
  const { theme } = useUniwind();
  const setIsVersionChecked = useAppStore((s) => s.setIsVersionChecked);
  const setIsNewVersionAvailable = useAppStore((s) => s.setIsNewVersionAvailable);
  const isVersionChecked = useAppStore((s) => s.isVersionChecked);
  const isNewVersionAvailable = useAppStore((s) => s.isNewVersionAvailable);
  const [updateSheetOpen, setUpdateSheetOpen] = useState(false);
  const [updateSheetMode, setUpdateSheetMode] = useState<UpdateBottomSheetMode>('new-version');

  const handleVersionChecked = (isNew: boolean) => {
    setIsVersionChecked(true);
    setIsNewVersionAvailable(isNew);
    if (isNew) {
      setUpdateSheetMode('new-version');
      setUpdateSheetOpen(true);
    }
  };

  const handleOtaUpdateReady = () => {
    setUpdateSheetMode('ota-update');
    setUpdateSheetOpen(true);
  };

  useVersionCheck({ onVersionChecked: handleVersionChecked });
  useOtaUpdate({ isVersionChecked, isNewVersionAvailable, onUpdateReady: handleOtaUpdateReady });

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
      <ThemeProvider value={theme.includes('dark') ? DarkTheme : DefaultTheme}>
        <AppContent />
        <UpdateBottomSheet
          isOpen={updateSheetOpen}
          onOpenChange={setUpdateSheetOpen}
          mode={updateSheetMode}
        />
      </ThemeProvider>
    </RootProvider>
  );
}

export default ObserveRoot.wrap(RootLayout);
