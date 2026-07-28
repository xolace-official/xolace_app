import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { PressableFeedback } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';

// TODO(asset): placeholder — swap for the dedicated quotes illustration when it
// lands, and drop the oversize/offset trick with it.
//
// The source is a 2×2 grid of figures, so it has to be zoomed and offset to
// isolate one; `contentFit`/`contentPosition` alone only pan, they don't zoom.
// Source is 1200×1000; the bottom-left figure sits at roughly x 230–580,
// y 470–1000, and 0.40 is the scale that lands that region in a 132pt box.
const ART = require('@/assets/images/illustrations/discovery-image-bg.png');
const ART_SCALE = 0.4;

const styles = StyleSheet.create({
  card: { borderCurve: 'continuous' },
  artWindow: { width: 132, height: 132 },
  art: {
    position: 'absolute',
    width: 1200 * ART_SCALE,
    height: 1000 * ART_SCALE,
    left: -230 * ART_SCALE,
    top: -470 * ART_SCALE,
  },
});

/**
 * Entry point to the quotes screen. Deliberately fetches nothing — it names
 * where it leads rather than previewing a quote, so discovery stays a cheap
 * screen and the quote itself keeps its impact where it actually lives.
 *
 * Copy sits left, art bleeds into the card's right edge and is clipped by the
 * card radius.
 */
export function DailyQuotesCard() {
  const router = useRouter();

  const goToQuotes = () => {
    playSoftPress();
    router.push('/(protected)/quotes');
  };

  return (
    <PressableFeedback
      onPress={goToQuotes}
      accessibilityRole="button"
      accessibilityLabel="Open daily quotes"
    >
      <View
        className="flex-row items-center overflow-hidden rounded-3xl border border-border/60 bg-surface"
        style={styles.card}
      >
        <View className="flex-1 py-6 pl-5 pr-3">
          <AppText className="text-lg font-semibold text-foreground">Daily Quotes</AppText>
          <AppText className="mt-1.5 text-sm leading-5 text-muted">
            Curated lines for the day, and the ones your own sessions left behind.
          </AppText>
        </View>
        <View className="overflow-hidden" style={styles.artWindow}>
          <Image
            source={ART}
            contentFit="cover"
            style={styles.art}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </View>
    </PressableFeedback>
  );
}
