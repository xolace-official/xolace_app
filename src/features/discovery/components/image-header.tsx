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

// Anchor the crop low so the figures sit under the type block rather than
// behind it — the display lines keep a near-flat field to read against.
const ART_CROP = { bottom: 0 } as const;

const styles = StyleSheet.create({
  display: { letterSpacing: -1.1 },
  eyebrow: { letterSpacing: 1.4 },
});

/**
 * Variant B — the illustration is the field. Same content as `PosterHeader`,
 * but the art runs full-bleed behind everything with a solid accent scrim over
 * it, so the poster keeps its brand colour while the illustration supplies the
 * warmth. Still no animation; the scrim is what holds text contrast.
 *
 * Swap variants in `discovery-header.tsx` — in code, not in the UI.
 */
export function ImageHeader() {
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
      <StatusBar style={isDark ? 'dark' : 'light'} />

      <Image
        source={ART}
        contentFit="cover"
        contentPosition={ART_CROP}
        style={StyleSheet.absoluteFill}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      {/* Scrim. The accent fill is what makes the type legible over a busy,
          multi-hue illustration — thinning it below ~85% drops the eyebrow and
          the greeting under 4.5:1. */}
      <View className="absolute inset-0 bg-accent/90" />

      <View className="px-6 pb-7" style={{ paddingTop: insets.top + 12 }}>
        <AppText
          className="text-[10px] font-medium uppercase text-accent-foreground/70"
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
              className="text-[36px] leading-[38px] font-normal text-accent-foreground/75"
              style={styles.display}
            >
              {XOLACER_TAIL}
            </AppText>
            <SymbolView name="arrow.right" size={18} tintColor={onAccent as string} />
          </View>
        </PressableFeedback>

        <View className="mt-10">
          <AppText className="text-[13px] font-semibold text-accent-foreground">
            {getGreeting(user?.firstName)}
          </AppText>
          <AppText className="mt-0.5 text-[12px] leading-4 text-accent-foreground/75">
            You made it here again.
          </AppText>
        </View>
      </View>
    </View>
  );
}
