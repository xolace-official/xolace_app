/**
 * Root layout — wraps the entire app in providers and renders the tab navigation.
 *
 * Provider order: RootProvider (gestures, keyboard, theme, HeroUI) → ThemeProvider (React Navigation).
 * See src/providers/root-provider.tsx to add your own providers (auth, analytics, etc.).
 */
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useUniwind } from 'uniwind'

import { RootProvider } from '@/providers/root-provider';


const AppContent = () => {
    const isOnboarded = true;
    const isAuthenticated = false;
  return (
        <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Protected guard={!isOnboarded}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isOnboarded && !isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isOnboarded && isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{}} />
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
  const { theme } = useUniwind()
  return (
    <RootProvider>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppContent />
      </ThemeProvider>
    </RootProvider>
  );
}
