import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease/uniwind';
import { FadeIn, LinearTransition } from 'react-native-reanimated';
import { Button , Spinner, useThemeColor} from 'heroui-native';
import { playSoftPress } from '@/src/lib/haptics';
import { useAuth } from '@clerk/expo';
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

const AUTH_EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_SLIDE_INITIAL = { opacity: 0, translateY: 20 };
const EASE_SLIDE_ANIMATE = { opacity: 1, translateY: 0 };
const EASE_TITLE_TRANSITION = {
  opacity: { type: 'timing' as const, duration: 400, delay: 300, easing: AUTH_EASING },
  transform: { type: 'spring' as const, damping: 20, stiffness: 120, mass: 1, delay: 300 },
};
const EASE_APPLE_TRANSITION = {
  opacity: { type: 'timing' as const, duration: 400, delay: 600, easing: AUTH_EASING },
  transform: { type: 'spring' as const, damping: 30, stiffness: 120, mass: 1, delay: 600 },
};
const EASE_GOOGLE_TRANSITION = {
  opacity: { type: 'timing' as const, duration: 400, delay: 750, easing: AUTH_EASING },
  transform: { type: 'spring' as const, damping: 30, stiffness: 120, mass: 1, delay: 750 },
};
const SPINNER_ENTERING = FadeIn.delay(50);

export const AuthScreen = () => {
  const insets = useSafeAreaInsets();
  const themeColorAccentForeground = useThemeColor('accent-foreground');
  const { isSignedIn, signOut } = useAuth();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const getOrCreate = useMutation(api.users.getOrCreate);
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | null>(null);
  const posthog = usePostHog();

  const handleAppleAuth = useCallback(async () => {
    playSoftPress();

    try {
      setLoadingProvider('apple');

      // A stale Clerk session (active client-side but never validated by
      // Convex) makes the SSO flow throw "You're already signed in" and
      // dead-ends the user here. Clear it first so a fresh sign-in proceeds.
      if (isSignedIn) {
        await signOut();
      }

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
  }, [startAppleAuthenticationFlow, getOrCreate, posthog, isSignedIn, signOut]);

  const handleGoogleAuth = useCallback(async () => {
    playSoftPress();

    try {
      setLoadingProvider('google');

      // A stale Clerk session (active client-side but never validated by
      // Convex) makes the SSO flow throw "You're already signed in" and
      // dead-ends the user here. Clear it first so a fresh sign-in proceeds.
      if (isSignedIn) {
        await signOut();
      }

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
      } else {
        console.warn('[GoogleAuth] no session created — createdSessionId:', createdSessionId);
      }
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code: string | number }).code
          : undefined;

      if (code === 'SIGN_IN_CANCELLED' || code === -5) {
        console.log('[GoogleAuth] cancelled by user, code:', code);
        return;
      }

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
  }, [startGoogleAuthenticationFlow, getOrCreate, posthog, isSignedIn, signOut]);


  const safeAreaStyle = { paddingTop: insets.top, paddingBottom: insets.bottom };

  return (
    <View
      className="flex-1 bg-background"
      style={safeAreaStyle}
    >
      <DuskDriftBackdrop />

      <View style={styles.content}>
        {/* Title */}
        <EaseView
          initialAnimate={EASE_SLIDE_INITIAL}
          animate={EASE_SLIDE_ANIMATE}
          transition={EASE_TITLE_TRANSITION}
        >
          <AppText
            className="text-foreground/90 text-[22px] leading-9"
            style={styles.fontMedium}
          >
            Let&apos;s keep your{'\n'}reflections safe.
          </AppText>
        </EaseView>

        {/* Auth buttons */}
        <View style={styles.buttonRow}>
          {/* Apple */}
          <EaseView
            initialAnimate={EASE_SLIDE_INITIAL}
            animate={EASE_SLIDE_ANIMATE}
            transition={EASE_APPLE_TRANSITION}
          >
            <Button
              onPress={handleAppleAuth}
              variant="ghost"
              size="lg"
              isDisabled={loadingProvider !== null}
              isIconOnly={loadingProvider === 'apple'}
              layout={LinearTransition.springify()}
              className={`bg-white rounded-[14px] py-3.5 px-6${loadingProvider === 'apple' ? ' self-center' : ''}`}
            >
              {loadingProvider === 'apple' ? (
                <Spinner entering={SPINNER_ENTERING} color="#000" />
              ) : (
                <>
                  <AppleIcon size={20} color="#000" />
                  <Button.Label className="text-[15px] text-black" style={styles.fontMedium}>
                    Continue with Apple
                  </Button.Label>
                </>
              )}
            </Button>
          </EaseView>

          {/* Google */}
          <EaseView
            initialAnimate={EASE_SLIDE_INITIAL}
            animate={EASE_SLIDE_ANIMATE}
            transition={EASE_GOOGLE_TRANSITION}
          >
            <Button
              onPress={handleGoogleAuth}
              variant="outline"
              size="lg"
              isDisabled={loadingProvider !== null}
              isIconOnly={loadingProvider === 'google'}
              layout={LinearTransition.springify()}
              className={`rounded-[14px] py-3.5 px-6 bg-foreground/8 border-accent/20${loadingProvider === 'google' ? ' self-center' : ''}`}
            >
              {loadingProvider === 'google' ? (
                <Spinner entering={SPINNER_ENTERING} color={themeColorAccentForeground} />
              ) : (
                <>
                  <GoogleIcon size={20} />
                  <Button.Label className="text-[15px] text-foreground/90" style={styles.fontRegular}>
                    Continue with Google
                  </Button.Label>
                </>
              )}
            </Button>
          </EaseView>
        </View>

        {/* Privacy reassurance + terms */}
        <LegalLinks />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 32, paddingBottom: 24, gap: 40 },
  buttonRow: { gap: 12 },
  fontMedium: { fontFamily: 'Poppins-Medium' },
  fontRegular: { fontFamily: 'Poppins-Regular' },
});
