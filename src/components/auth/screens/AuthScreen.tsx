import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button } from 'heroui-native';

import { AppText } from '@/components/shared/app-text';
import { AuthBg } from '@/components/auth/auth-bg';
import { AppleIcon } from '@/components/auth/apple-icon';
import { GoogleIcon } from '@/components/auth/google-icon';

export const AuthScreen = () => {
  const insets = useSafeAreaInsets();

  const handleAppleAuth = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: wire to Clerk Apple OAuth
  };

  const handleGoogleAuth = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: wire to Clerk Google OAuth
  };

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
            entering={FadeInDown.delay(600).duration(800).springify().damping(20)}
          >
            <Button
              onPress={handleAppleAuth}
              variant="ghost"
              size="lg"
              className="bg-white rounded-[14px] py-3.5 px-6"
            >
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
            entering={FadeInDown.delay(750).duration(800).springify().damping(20)}
          >
            <Button
              onPress={handleGoogleAuth}
              variant="outline"
              size="lg"
              className="rounded-[14px] py-3.5 px-6"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(217, 171, 111, 0.2)',
              }}
            >
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
        <Animated.View
          entering={FadeIn.delay(900).duration(800)}
          style={{ gap: 16 }}
        >
          <AppText
            className="text-white/40 text-[13px] leading-6"
            style={{ textAlign: 'center', fontWeight: '300' }}
          >
            This just saves your reflections so you{'\n'}
            never lose them. We don&apos;t see your{'\n'}
            name or email.
          </AppText>
          <AppText
            className="text-white/30 text-[12px] leading-5"
            style={{ textAlign: 'center' }}
          >
            By continuing you agree to the{' '}
            <AppText
              className="text-white/50 text-[12px]"
              style={{ textDecorationLine: 'underline' }}
            >
              Terms of Service
            </AppText>
            {' '}and{' '}
            <AppText
              className="text-white/50 text-[12px]"
              style={{ textDecorationLine: 'underline' }}
            >
              Privacy Policy
            </AppText>
          </AppText>
        </Animated.View>
      </View>
    </View>
  );
};
