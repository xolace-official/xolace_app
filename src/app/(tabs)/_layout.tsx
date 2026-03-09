/**
 * Tabs layout — renders the animated splash overlay and tab navigation.
 * Providers (RootProvider, ThemeProvider) are applied in the root layout.
 */
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
    </>
  );
}
