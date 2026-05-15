import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease/uniwind';
import { FadeIn } from 'react-native-reanimated';
import { Button , Spinner, useThemeColor} from 'heroui-native';
import { playSoftPress } from '@/src/lib/haptics';
import { useSignInWithGoogle } from '@clerk/expo/google';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePostHog } from 'posthog-react-native';

import { AppText } from '@/src/components/shared/app-text';
import { DuskDriftBackdrop } from '@/src/features/onboarding/components/dusk-drift-backdrop';
import { AppleIcon } from '@/src/features/auth/components/apple-icon';
import { GoogleIcon } from '@/src/features/auth/components/google-icon';
import { LegalLinks } from '@/src/features/auth/components/legal-links';

export const AuthScreen = () => {
  const insets = useSafeAreaInsets();
  const themeColorAccentForeground = useThemeColor('accent-foreground');
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const getOrCreate = useMutation(api.users.getOrCreate);
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | null>(null);
  const posthog = usePostHog();

  const handleAppleAuth = useCallback(async () => {
    playSoftPress();

    try {
      setLoadingProvider('apple');

      const { createdSessionId, setActive, signUp } =
        await startAppleAuthenticationFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        const userId = await getOrCreate({
          authProvider: 'apple',
          authProviderAccountId: signUp?.createdUserId ?? 'apple-user',
        });

        posthog.identify(userId, {
          $set: { auth_provider: 'apple' },
          $set_once: { first_sign_in_date: new Date().toISOString() },
        });
        posthog.capture('user_signed_in', {
          auth_provider: 'apple',
          is_new_user: !!signUp?.createdUserId,
        });
      }
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code: string | number }).code
          : undefined;

      if (code === 'ERR_REQUEST_CANCELED') return;

      let msg = 'Unknown';
      if (error instanceof Error) {
        msg = `${error.name}: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        const keys = Object.getOwnPropertyNames(error);
        msg = keys.length > 0
          ? keys.map(k => `${k}: ${JSON.stringify((error as Record<string, unknown>)[k])}`).join('\n')
          : `Empty object. Proto: ${Object.getPrototypeOf(error)?.constructor?.name ?? 'none'}`;
      } else {
        msg = String(error);
      }
      console.error('Apple auth error:', msg);
      posthog.capture('$exception', {
        $exception_list: [
          {
            type: 'AppleAuthError',
            value: msg,
          },
        ],
        auth_provider: 'apple',
      });
    } finally {
      setLoadingProvider(null);
    }
  }, [startAppleAuthenticationFlow, getOrCreate, posthog]);

  const handleGoogleAuth = useCallback(async () => {
    playSoftPress();

    try {
      setLoadingProvider('google');

      const { createdSessionId, setActive, signUp } =
        await startGoogleAuthenticationFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        const userId = await getOrCreate({
          authProvider: 'google',
          authProviderAccountId: signUp?.createdUserId ?? 'google-user',
        });

        posthog.identify(userId, {
          $set: { auth_provider: 'google' },
          $set_once: { first_sign_in_date: new Date().toISOString() },
        });
        posthog.capture('user_signed_in', {
          auth_provider: 'google',
          is_new_user: !!signUp?.createdUserId,
        });
      }
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code: string | number }).code
          : undefined;

      // Silently handle user cancellation
      if (code === 'SIGN_IN_CANCELLED' || code === -5) return;

      // TEMP: extract all error details for debugging
      let msg = 'Unknown';
      if (error instanceof Error) {
        msg = `${error.name}: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        const keys = Object.getOwnPropertyNames(error);
        msg = keys.length > 0
          ? keys.map(k => `${k}: ${JSON.stringify((error as Record<string, unknown>)[k])}`).join('\n')
          : `Empty object. Proto: ${Object.getPrototypeOf(error)?.constructor?.name ?? 'none'}`;
      } else {
        msg = String(error);
      }
      console.error('Google auth error:', msg);
      posthog.capture('$exception', {
        $exception_list: [
          {
            type: 'GoogleAuthError',
            value: msg,
          },
        ],
        auth_provider: 'google',
      });
    } finally {
      setLoadingProvider(null);
    }
  }, [startGoogleAuthenticationFlow, getOrCreate, posthog]);

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <DuskDriftBackdrop />

      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: 32,
          paddingBottom: 24,
          gap: 40,
        }}
      >
        {/* Title */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            opacity: { type: 'timing', duration: 400, delay: 300, easing: [0.455, 0.03, 0.515, 0.955] },
            transform: { type: 'spring', damping: 20, stiffness: 120, mass: 1, delay: 300 },
          }}
        >
          <AppText
            className="text-foreground/90 text-[22px] leading-9"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            Let&apos;s keep your{'\n'}reflections safe.
          </AppText>
        </EaseView>

        {/* Auth buttons */}
        <View style={{ gap: 12 }}>
          {/* Apple */}
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              opacity: { type: 'timing', duration: 400, delay: 600, easing: [0.455, 0.03, 0.515, 0.955] },
              transform: { type: 'spring', damping: 30, stiffness: 120, mass: 1, delay: 600 },
            }}
          >
            <Button
              onPress={handleAppleAuth}
              variant="ghost"
              size="lg"
              isDisabled={loadingProvider !== null}
              className="bg-white rounded-[14px] py-3.5 px-6"
            >
              {loadingProvider === 'apple' && <Spinner entering={FadeIn.delay(50)} color="#000" />}
              <AppleIcon size={20} color="#000" />
              <Button.Label
                className="text-[15px] text-black"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Continue with Apple
              </Button.Label>
            </Button>
          </EaseView>

          {/* Google */}
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              opacity: { type: 'timing', duration: 400, delay: 750, easing: [0.455, 0.03, 0.515, 0.955] },
              transform: { type: 'spring', damping: 30, stiffness: 120, mass: 1, delay: 750 },
            }}
          >
            <Button
              onPress={handleGoogleAuth}
              variant="outline"
              size="lg"
              isDisabled={loadingProvider !== null}
              className="rounded-[14px] py-3.5 px-6 bg-foreground/8 border-accent/20"
            >
              {loadingProvider === 'google' && <Spinner entering={FadeIn.delay(50)} color={themeColorAccentForeground} />}
              <GoogleIcon size={20} />
              <Button.Label
                className="text-[15px] text-foreground/90"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                Continue with Google
              </Button.Label>
            </Button>
          </EaseView>
        </View>

        {/* Privacy reassurance + terms */}
        <LegalLinks />
      </View>
    </View>
  );
};
