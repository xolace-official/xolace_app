import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { useAppTheme } from '@/src/context/app-theme-context';
import {
  XOLACER_LEAD,
  XOLACER_TAIL,
  getDateStamp,
  getGreeting,
} from '@/src/features/discovery/greeting';

const ART = require('@/assets/images/illustrations/discovery-image-bg.png');

// The asset is a 4-up illustration; cropping to the top-right quadrant isolates
// one figure so the tile reads as a portrait, not a collage of half-faces.
const ART_CROP = { top: 0, right: 0 } as const;

const styles = StyleSheet.create({
  // Space Grotesk needs negative tracking to hold together at display size.
  // letterSpacing is px in RN, so it can't live in a Tailwind class.
  display: { letterSpacing: -1.1 },
  eyebrow: { letterSpacing: 1.4 },
  art: { width: 128, height: 138 },
});

/**
 * Variant A — solid poster masthead. The accent field runs full-bleed under the
 * status bar and closes with a rounded bottom edge, so the brand owns the top of
 * the screen. The illustration sits as a cropped art tile, the way the reference
 * poster offsets its product photo against the type block. No animation.
 *
 * Swap variants in `discovery-header.tsx` — in code, not in the UI.
 */
export function PosterHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { isDark } = useAppTheme();
  const onAccent = useThemeColor('accent-foreground');

  const goToListenerSetup = () => {
    playSoftPress();
    router.push('/listener-setup' as never);
  };

  return (
    <View className="overflow-hidden rounded-b-[34px] bg-accent">
      {/* --accent is dark in light theme and light in dark theme, so the status
          bar content inverts against the app theme on this screen only. */}
      <StatusBar style={isDark ? 'dark' : 'light'} />

      <View className="px-6 pb-7" style={{ paddingTop: insets.top + 12 }}>
        <AppText
          className="text-[10px] font-medium uppercase text-accent-foreground/60"
          style={styles.eyebrow}
        >
          {getDateStamp()}
        </AppText>

        <PressableFeedback
          onPress={goToListenerSetup}
          accessibilityRole="button"
          accessibilityLabel="Become a Xolacer"
          className="mt-4"
        >
          <AppText
            className="text-[36px] leading-[38px] font-bold text-accent-foreground"
            style={styles.display}
          >
            {XOLACER_LEAD}
          </AppText>
          <View className="mt-1 flex-row items-center gap-2">
            <AppText
              className="text-[36px] leading-[38px] font-normal text-accent-foreground/70"
              style={styles.display}
            >
              {XOLACER_TAIL}
            </AppText>
            <SymbolView name="arrow.right" size={18} tintColor={onAccent as string} />
          </View>
        </PressableFeedback>

        <View className="mt-8 flex-row items-end justify-between gap-4">
          <View className="flex-1">
            <AppText className="text-[13px] font-semibold text-accent-foreground">
              {getGreeting(user?.firstName)}
            </AppText>
            <AppText className="mt-0.5 text-[12px] leading-4 text-accent-foreground/70">
              You made it here again.
            </AppText>
          </View>
          <View className="overflow-hidden rounded-[22px] border border-accent-foreground/15">
            <Image
              source={ART}
              contentFit="cover"
              contentPosition={ART_CROP}
              style={styles.art}
              accessibilityLabel="People holding their phones, quietly"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
