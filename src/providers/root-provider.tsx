import { HeroUINativeConfig, HeroUINativeProvider } from 'heroui-native';
import { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';
import { PostHogProvider } from 'posthog-react-native';
import { AppThemeProvider } from '@/src/context/app-theme-context';
import { SessionModeProvider } from '@/src/context/session-mode-context';
import {ConvexClientProvider} from './convex-provider';
import { posthog } from '@/src/config/posthog';

/**
 * Root provider that composes all app-wide providers in the correct order.
 *
 * Provider hierarchy:
 *   GestureHandlerRootView → KeyboardProvider → AppThemeProvider → SessionModeProvider → PostHogProvider → ConvexClientProvider → HeroUINativeProvider
 *
 * Customize this for your app:
 * - Add your own providers (e.g. auth, analytics, query client) inside the chain
 * - Adjust the HeroUINativeConfig to configure toast behavior, dev info, etc.
 * - The KeyboardAvoidingView wraps toast content — modify keyboardVerticalOffset as needed
 */
export function RootProvider({ children }: { children: React.ReactNode }) {

  const contentWrapper = useCallback(
    (children: React.ReactNode) => (
      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior="padding"
        keyboardVerticalOffset={12}
        style={{ flex: 1 }}
      >
        {children}
      </KeyboardAvoidingView>
    ),
    []
  );

  const config: HeroUINativeConfig = {
    toast: {
      contentWrapper,
    },
    devInfo: {
      stylingPrinciples: false,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <AppThemeProvider>
          <SessionModeProvider>
            <PostHogProvider
              client={posthog}
              autocapture={{
                captureScreens: false,
                captureTouches: true,
                propsToCapture: ['testID'],
              }}
            >
              <ConvexClientProvider>
                <HeroUINativeProvider config={config}>
                  {children}
                </HeroUINativeProvider>
              </ConvexClientProvider>
            </PostHogProvider>
          </SessionModeProvider>
        </AppThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
