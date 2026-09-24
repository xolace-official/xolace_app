/**
 * PROTOTYPE — throwaway (#395). Variant A — Cover fold.
 *
 * Full-bleed parallax cover with the title on the photo. As you scroll, the
 * body sheet (rounded top) rides up over the cover and folds under a pinned
 * bar that keeps a slice of the same photo, where the compact title lands.
 * Transform-only: nothing in here changes layout per frame.
 *
 * Layers, back to front: cover photo → scroller (title in its clear top
 * region, then the sheet) → bar window (a clipped copy of the photo at the
 * same offset, so it is invisible until content slides under it) → controls.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/shared/app-text';
import { READING_FACE, useMockPlayback, type MockEntry } from './mock-entry';
import { EndMagazine } from './end-magazine';
import { BackButton, EntryBody, GlassButton, Glyph, KindAndTime, SourceCredit } from './shared';
import { BackToTop } from './back-to-top';
import { useCurrentSection, useSectionTracker, type SectionTracker } from './section-tracker';
import { DockedMiniPlayer } from './variant-a-mini-player';

const SHEET_OVERLAP = 28;
const BAR_ROW = 52;
const MINI_PLAYER_H = 72; // ponytail: measured by eye; onLayout if the player's height ever varies
const SCRIM = ['transparent', 'rgba(0,0,0,0.65)'] as const; // ponytail: photo scrim, not a theme colour

export function VariantACoverFold({ entry, isPlus }: { entry: MockEntry; isPlus: boolean }) {
  const insets = useSafeAreaInsets();
  const { height: screenH, width } = useWindowDimensions();
  const coverH = Math.round(screenH * 0.52);
  const barH = insets.top + BAR_ROW;
  const fold = coverH - SHEET_OVERLAP - barH; // scroll at which the sheet meets the bar
  const imageStop = (coverH - barH) / 2; // parallax travel before the photo pins

  const playback = useMockPlayback(entry.listenMin * 60, isPlus);
  const [contentH, setContentH] = useState(1);
  const [viewH, setViewH] = useState(1);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const tracker = useSectionTracker(entry.sections.length);
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.set(e.contentOffset.y);
  });

  // The photo, both copies: half-speed parallax, pinned once it has travelled
  // `imageStop`; pulled down, it grows from its top edge instead.
  const photo = useAnimatedStyle(() => {
    const v = y.get();
    return v < 0
      ? { transform: [{ scale: 1 + -v / coverH }], transformOrigin: 'top' }
      : { transform: [{ translateY: -Math.min(v * 0.5, imageStop) }] };
  });
  const largeTitle = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [0, fold * 0.7], [1, 0], 'clamp'),
  }));
  const barShade = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [fold - 60, fold], [0, 1], 'clamp'),
  }));
  const barTitle = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [fold - 10, fold + 30], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(y.get(), [fold - 10, fold + 30], [6, 0], 'clamp') }],
  }));
  const readBar = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.min(Math.max((y.get() - fold) / Math.max(contentH - viewH - fold, 1), 0), 1) }],
    opacity: y.get() > fold ? 1 : 0,
  }));

  // The dock is flush with the bottom edge: its row plus the safe area under it.
  const pillBottom = insets.bottom + 16;
  const pillLift = playback.started ? MINI_PLAYER_H + insets.bottom + 8 + 12 - pillBottom : 0;

  // One element, drawn twice: behind the scroller and inside the bar window.
  const photoEl = (
    <Animated.View style={[{ width, height: coverH }, photo]}>
      <Image source={entry.coverUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient colors={SCRIM} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background" onLayout={(e) => setViewH(e.nativeEvent.layout.height)}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* #396 zoom experiment: the cover is where a tapped thumbnail/card lands */}
        <Link.AppleZoomTarget>
          <View style={{ width, height: coverH }}>{photoEl}</View>
        </Link.AppleZoomTarget>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(_, h) => setContentH(h)}
      >
        <Animated.View
          pointerEvents="none"
          className="justify-end px-6 pb-12"
          style={[{ height: coverH - SHEET_OVERLAP }, largeTitle]}
        >
          <AppText className="mb-2 text-xs uppercase tracking-widest text-white/80">{entry.kind}</AppText>
          <AppText className="text-white" style={{ fontFamily: READING_FACE, fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
            {entry.title}
          </AppText>
          <KindAndTime entry={entry} className="mt-2 text-sm text-white/80" />
        </Animated.View>

        <View className="rounded-t-[28px] bg-background px-6 pt-6" style={{ borderCurve: 'continuous', minHeight: screenH }}>
          <View className="mb-8 flex-row items-center gap-3">
            <View className="flex-1">
              <SourceCredit entry={entry} />
            </View>
            <Pressable
              onPress={playback.toggle}
              className="flex-row items-center gap-2 rounded-full bg-surface-secondary px-4 py-2 active:opacity-70"
            >
              <Glyph name={playback.isPlaying ? 'pause.fill' : 'headphones'} size={14} />
              <AppText className="font-semibold text-sm">{playback.started ? 'Playing' : `Listen · ${entry.listenMin}m`}</AppText>
            </Pressable>
          </View>
          <View onLayout={(e) => tracker.bodyY.set(coverH - SHEET_OVERLAP + e.nativeEvent.layout.y)}>
            <EntryBody entry={entry} onSectionLayout={tracker.onSectionLayout} />
          </View>
          <EndMagazine entry={entry} bottomInset={insets.bottom + (playback.started ? 150 : 80)} />
        </View>
      </Animated.ScrollView>

      {/* The bar window: same photo, same offset, clipped to the bar. */}
      <View pointerEvents="box-none" className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: barH }}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {photoEl}
          <Animated.View style={[StyleSheet.absoluteFill, barShade]} className="bg-black/35" />
        </View>
        <View className="flex-1 flex-row items-center gap-3 px-4" style={{ paddingTop: insets.top }}>
          <BackButton onImage />
          <Animated.View style={[{ flex: 1 }, barTitle]}>
            <AppText numberOfLines={1} className="font-semibold text-white">
              {entry.title}
            </AppText>
            <BarSection entry={entry} scrollY={y} line={barH + 24} tracker={tracker} />
          </Animated.View>
          <GlassButton name="bookmark" label="Save" onImage />
          <GlassButton name="square.and.arrow.up" label="Share" onImage />
        </View>
        <Animated.View style={[{ height: 2, transformOrigin: 'left' }, readBar]} className="bg-white/80" />
      </View>

      <BackToTop
        scrollY={y}
        endAt={contentH > viewH ? contentH - viewH - 40 : Number.POSITIVE_INFINITY}
        bottom={pillBottom}
        lift={pillLift}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      />
      <DockedMiniPlayer entry={entry} playback={playback} bottom={insets.bottom} />
    </View>
  );
}

/**
 * "1 of 4 · Why it happens" under the bar title. Its own component so a
 * section change re-renders this line only (see section-tracker.ts for cost).
 */
function BarSection({
  entry,
  scrollY,
  line,
  tracker,
}: {
  entry: MockEntry;
  scrollY: SharedValue<number>;
  line: number;
  tracker: SectionTracker;
}) {
  // Clamped to the first section: the label is only visible once the sheet
  // has reached the bar, and an empty second line would make the title jump.
  const index = Math.max(useCurrentSection(scrollY, line, tracker), 0);
  return (
    <Animated.View key={index} entering={FadeIn.duration(200)}>
      <AppText numberOfLines={1} className="text-xs text-white/70">
        {index + 1} of {entry.sections.length} · {entry.sections[index].heading}
      </AppText>
    </Animated.View>
  );
}
