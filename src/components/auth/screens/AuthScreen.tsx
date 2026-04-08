import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Button , Spinner, useThemeColor} from 'heroui-native';
import { playSoftPress } from '@/src/lib/haptics';
import { useSignInWithGoogle } from '@clerk/expo/google';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

import { AppText } from '@/src/components/shared/app-text';
import { AuthBg } from '@/src/components/auth/auth-bg';
import { AppleIcon } from '@/src/components/auth/apple-icon';
import { GoogleIcon } from '@/src/components/auth/google-icon';
import { LegalLinks } from '@/src/components/auth/legal-links';

export const AuthScreen = () => {
  const insets = useSafeAreaInsets();
  const themeColorAccentForeground = useThemeColor('accent-foreground');
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const getOrCreate = useMutation(api.users.getOrCreate);
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | null>(null);

  const handleAppleAuth = useCallback(async () => {
    playSoftPress();

    try {
      setLoadingProvider('apple');

      const { createdSessionId, setActive, signUp } =
        await startAppleAuthenticationFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        await getOrCreate({
          authProvider: 'apple',
          authProviderAccountId: signUp?.createdUserId ?? 'apple-user',
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
    } finally {
      setLoadingProvider(null);
    }
  }, [startAppleAuthenticationFlow, getOrCreate]);

  const handleGoogleAuth = useCallback(async () => {
    playSoftPress();

    try {
      setLoadingProvider('google');

      const { createdSessionId, setActive, signUp } =
        await startGoogleAuthenticationFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        await getOrCreate({
          authProvider: 'google',
          authProviderAccountId: signUp?.createdUserId ?? 'google-user',
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
    } finally {
      setLoadingProvider(null);
    }
  }, [startGoogleAuthenticationFlow, getOrCreate]);

  return (
    <View
      className="flex-1 bg-neutral-950"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <AuthBg />

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
        <Animated.View
          entering={FadeInDown.delay(300).duration(800).springify().damping(20)}
        >
          <AppText
            className="text-white/90 text-[22px] leading-9"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            Let&apos;s keep your{'\n'}reflections safe.
          </AppText>
        </Animated.View>

        {/* Auth buttons */}
        <View style={{ gap: 12 }}>
          {/* Apple */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(800).springify().damping(30)}
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
          </Animated.View>

          {/* Google */}
          <Animated.View
            entering={FadeInDown.delay(750).duration(800).springify().damping(30)}
          >
            <Button
              onPress={handleGoogleAuth}
              variant="outline"
              size="lg"
              isDisabled={loadingProvider !== null}
              className="rounded-[14px] py-3.5 px-6"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(217, 171, 111, 0.2)',
              }}
            >
              {loadingProvider === 'google' && <Spinner entering={FadeIn.delay(50)} color={themeColorAccentForeground} />}
              <GoogleIcon size={20} />
              <Button.Label
                className="text-[15px] text-white/90"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                Continue with Google
              </Button.Label>
            </Button>
          </Animated.View>
        </View>

        {/* Privacy reassurance + terms */}
        <LegalLinks />
      </View>
    </View>
  );
};
