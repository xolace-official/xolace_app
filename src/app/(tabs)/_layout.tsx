/**
 * Tabs layout — renders the animated splash overlay and tab navigation.
 * Providers (RootProvider, ThemeProvider) are applied in the root layout.
 */
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

/**
 * Root layout component that wraps the app with RootProvider and a ThemeProvider, and renders the animated splash overlay followed by the tab navigator.
 *
 * @returns The root JSX element containing the provider hierarchy, `AnimatedSplashOverlay`, and `AppTabs`.
 */
export default function TabLayout() {
  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
    </>
  );
}
