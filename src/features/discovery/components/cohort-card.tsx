import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';

// TODO(asset): placeholder — swap for the dedicated "Flux with company" pose
// when it lands. This one reads as leaning in to tell you something, which is
// the register the bubble needs, but it doesn't carry the cohort idea itself.
const MASCOT = require('@/assets/images/flux/flux-look-mini-bg.png');

const styles = StyleSheet.create({
  mascot: { width: 84, height: 96 },
  bubble: { borderCurve: 'continuous' },
  // The tail is the bubble's own corner, rotated 45° and tucked behind its
  // left edge — so it inherits the fill and border without a second color.
  tail: {
    position: 'absolute',
    left: -5,
    top: 26,
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
  },
});

/**
 * Once a week, a real number of other campers who carried what the viewer last
 * carried. Flux says it — this is the app speaking to you, not a stat readout —
 * which is why it's a speech bubble and not a metric tile.
 *
 * Deliberately inert: no onPress, no destination. It's a moment of "you are not
 * alone," not an entry point to a feed that doesn't exist.
 *
 * Renders nothing until there's something honest to say (see convex/cohort.ts).
 */
export function CohortCard() {
  const card = useQuery(api.cohort.getWeeklyCohortCard);

  if (!card || card.status === 'hidden') return null;

  const line =
    card.status === 'count'
      ? `${card.count} campers sat with ${card.emotion} by the fire this week. You are not alone.`
      : `Others have sat with ${card.emotion} by this fire too. You are not alone.`;

  return (
    <View
      className="flex-row items-center gap-1"
      accessibilityRole="text"
      accessibilityLabel={line}
    >
      <Image
        source={MASCOT}
        contentFit="contain"
        style={styles.mascot}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View className="flex-1">
        <View className="rounded-3xl border border-border/60 bg-surface" style={styles.bubble}>
          <View className="border-b border-l border-border/60 bg-surface" style={styles.tail} />
          <AppText className="px-4 py-4 text-[15px] leading-6 text-foreground">{line}</AppText>
        </View>
      </View>
    </View>
  );
}
