/**
 * Root layout — wraps the entire app in providers and renders the tab navigation.
 *
 * Provider order: RootProvider (gestures, keyboard, theme, HeroUI) → ThemeProvider (React Navigation).
 * See src/providers/root-provider.tsx to add your own providers (auth, analytics, etc.).
 */
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useUniwind } from 'uniwind'

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { RootProvider } from '@/providers/root-provider';

/**
 * Root layout component that wraps the app with RootProvider and a ThemeProvider, and renders the animated splash overlay followed by the tab navigator.
 *
 * @returns The root JSX element containing the provider hierarchy, `AnimatedSplashOverlay`, and `AppTabs`.
 */
export default function TabLayout() {
  const { theme } = useUniwind()
  return (
    <RootProvider>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </RootProvider>
  );
}
