/**
 * PROTOTYPE — throwaway (#395). Variant C — Listen dock.
 *
 * Magazine page: an inset cover card, not a full bleed. The pinned bar tells
 * you *where* you are (the section you're in) instead of *how far*. Audio is a
 * persistent dock in the reference's shape (thumb, title, save, transport,
 * progress along its top edge) that tucks to one row while you scroll down
 * and opens again when you scroll up or reach the end.
 */
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/shared/app-text';
import { READING_FACE, useMockPlayback, type MockEntry } from './mock-entry';
import { EndMagazine } from './end-magazine';
import { BackButton, EntryBody, GlassButton, KindAndTime, SourceCredit } from './shared';
import { ListenDock } from './listen-dock';
import { useCurrentSection, useSectionTracker } from './section-tracker';

const BAR_ROW = 52;

export function VariantCListenDock({ entry, isPlus }: { entry: MockEntry; isPlus: boolean }) {
  const insets = useSafeAreaInsets();
  const barH = insets.top + BAR_ROW;
  const playback = useMockPlayback(entry.listenMin * 60, isPlus);

  const y = useSharedValue(0);
  const lastY = useSharedValue(0);
  const atEnd = useSharedValue(false);
  const tracker = useSectionTracker(entry.sections.length);
  // Called here, not in a leaf, because the bar and the dock both read it.
  const section = useCurrentSection(y, barH + 24, tracker);
  const [compact, setCompact] = useState(false);

  const onScroll = useAnimatedScrollHandler((e) => {
    const v = e.contentOffset.y;
    y.set(v);
    atEnd.set(v + e.layoutMeasurement.height >= e.contentSize.height - 40);
    // Direction with a little hysteresis, so a jittery thumb doesn't flap the dock.
    const d = v - lastY.get();
    if (Math.abs(d) > 12) {
      const tuck = d > 0 && v > 80 && !atEnd.get();
      runOnJS(setCompact)(tuck);
      lastY.set(v);
    }
  });

  const barSurface = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [120, 220], [0, 1], 'clamp'),
  }));

  const current = entry.sections[section];

  return (
    <View className="flex-1 bg-background">
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: barH + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 200 }}
      >
        <Image
          source={entry.coverUrl}
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 28 }}
          contentFit="cover"
          transition={200}
        />
        <View className="gap-3 px-1 pt-6">
          <KindAndTime entry={entry} className="text-xs uppercase tracking-widest text-muted" />
          <AppText style={{ fontFamily: READING_FACE, fontSize: 30, lineHeight: 36, fontWeight: '700' }}>
            {entry.title}
          </AppText>
          <View className="mt-2">
            <SourceCredit entry={entry} />
          </View>
        </View>

        <View className="mt-8 px-1" onLayout={(e) => tracker.bodyY.set(e.nativeEvent.layout.y)}>
          <EntryBody entry={entry} onSectionLayout={tracker.onSectionLayout} />
          <EndMagazine entry={entry} />
        </View>
      </Animated.ScrollView>

      <View className="absolute inset-x-0 top-0" style={{ height: barH }}>
        <Animated.View style={[StyleSheet.absoluteFill, barSurface]} className="border-b border-separator">
          <BlurView intensity={50} tint="default" style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View className="flex-1 flex-row items-center gap-3 px-4" style={{ paddingTop: insets.top }}>
          <BackButton />
          <View className="flex-1 items-center">
            {current ? (
              <Animated.View key={current.id} entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} className="items-center">
                <AppText className="text-[10px] uppercase tracking-widest text-muted">
                  {section + 1} of {entry.sections.length}
                </AppText>
                <AppText numberOfLines={1} className="font-semibold text-sm">
                  {current.heading}
                </AppText>
              </Animated.View>
            ) : null}
          </View>
          <GlassButton name="square.and.arrow.up" label="Share" />
        </View>
      </View>

      <ListenDock
        entry={entry}
        playback={playback}
        compact={compact}
        sectionIndex={Math.max(section, 0)}
        bottom={insets.bottom}
      />
    </View>
  );
}
