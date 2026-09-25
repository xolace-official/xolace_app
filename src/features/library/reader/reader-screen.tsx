/**
 * The Lantern reader (#407): the one screen an entry opens in. Built from the
 * "cover fold" variant chosen in #395.
 *
 * A full-bleed parallax cover with the title on the photo. Scrolling, the
 * rounded body sheet rides up over the cover and folds under a pinned bar
 * that shows a slice of the same photo, where the compact title lands.
 * Transform and opacity only: nothing here changes layout per frame.
 *
 * Layers, back to front: photo → scroller (title in its clear top region,
 * then the sheet) → bar window (a clipped copy of the photo at the same
 * offset, invisible until the sheet slides under it) → back to top.
 */
import { api } from '@/convex/_generated/api';
import type { FunctionReturnType } from 'convex/server';
import { Image } from 'expo-image';
import { useThemeColor } from 'heroui-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Linking, StyleSheet, useWindowDimensions, View } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/shared/app-text';
import { useAppStore } from '@/src/store/store';
import { AaSheet } from './aa-sheet';
import { BackToTop } from './back-to-top';
import { COVER_SCRIM } from './cover-palette';
import { metaLine, prepareBody } from './reader-copy';
import { ReaderPageScope } from './reader-page';
import { AaButton, BackButton, SourceCredit } from './reader-parts';
import { READING_MODES, useReadingFonts } from './reading-mode';
import { useMarkdownStyle } from './use-markdown-style';

export type ReaderEntry = NonNullable<FunctionReturnType<typeof api.library.entries.getEntry>>;

const SHEET_OVERLAP = 28;
const BAR_ROW = 52;

/** The reader on its reading mode's page (#408); the Aa sheet sits outside it, on the app theme. */
export function ReaderScreen({ entry }: { entry: ReaderEntry }) {
  const mode = useAppStore((s) => s.readingMode);
  const [aaOpen, setAaOpen] = useState(false);
  return (
    <>
      <ReaderPageScope page={READING_MODES[mode].page}>
        <ReaderView entry={entry} onOpenAa={() => setAaOpen(true)} />
      </ReaderPageScope>
      <AaSheet isOpen={aaOpen} onClose={() => setAaOpen(false)} />
    </>
  );
}

function ReaderView({ entry, onOpenAa }: { entry: ReaderEntry; onOpenAa: () => void }) {
  const insets = useSafeAreaInsets();
  const { height: screenH, width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const mode = useAppStore((s) => s.readingMode);
  const textSize = useAppStore((s) => s.readerTextSize);
  const markdownStyle = useMarkdownStyle(mode, textSize, useReadingFonts());
  // The page from the hook, not `bg-background`: the class doesn't pick up the
  // scoped page on this screen (#401 prototype finding).
  const page = useThemeColor('background');
  const coverH = Math.round(screenH * 0.52);
  const barH = insets.top + BAR_ROW;
  const fold = coverH - SHEET_OVERLAP - barH; // scroll at which the sheet meets the bar
  const imageStop = (coverH - barH) / 2; // parallax travel before the photo pins
  const drift = reduced ? 1 : 0.5; // reduced motion: the photo just scrolls, no parallax

  const [contentH, setContentH] = useState(1);
  const [viewH, setViewH] = useState(1);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.set(e.contentOffset.y);
  });

  // Both copies of the photo. Pulled down, it grows from its top edge.
  const photo = useAnimatedStyle(() => {
    const v = y.get();
    if (v < 0) return reduced ? {} : { transform: [{ scale: 1 - v / coverH }], transformOrigin: 'top' };
    return { transform: [{ translateY: -Math.min(v * drift, imageStop) }] };
  });
  const largeTitle = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [0, fold * 0.7], [1, 0], 'clamp'),
  }));
  const barShade = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [fold - 60, fold], [0, 1], 'clamp'),
  }));
  const barTitle = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [fold - 10, fold + 30], [0, 1], 'clamp'),
    transform: [{ translateY: reduced ? 0 : interpolate(y.get(), [fold - 10, fold + 30], [6, 0], 'clamp') }],
  }));
  const readBar = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.min(Math.max((y.get() - fold) / Math.max(contentH - viewH - fold, 1), 0), 1) }],
    opacity: y.get() > fold ? 1 : 0,
  }));

  // One element, drawn twice: behind the scroller and inside the bar window.
  const photoEl = (
    <Animated.View style={[{ width, height: coverH }, photo]} className="bg-cover-scrim">
      {/* ponytail: no cover → the plain scrim; the subject's cover lands when subjects get art */}
      {entry.coverUrl && (
        <Image source={{ uri: entry.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      )}
      <LinearGradient colors={COVER_SCRIM.colors} locations={COVER_SCRIM.locations} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: page }} onLayout={(e) => setViewH(e.nativeEvent.layout.height)}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {photoEl}
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
          <AppText accessibilityRole="header" className="font-bold text-[32px] leading-[38px] text-cover-ink">
            {entry.title}
          </AppText>
          <AppText className="mt-2 text-sm text-cover-ink/80">
            {metaLine(entry.kind, entry.readMin, entry.storyDescriptor)}
          </AppText>
        </Animated.View>

        <View
          className="rounded-t-[28px] px-6 pt-6"
          style={{ backgroundColor: page, borderCurve: 'continuous', minHeight: screenH, paddingBottom: insets.bottom + 96 }}
        >
          <View className="mb-6">
            <SourceCredit entry={entry} />
          </View>
          <EnrichedMarkdownText
            flavor="github"
            markdown={prepareBody(entry.markdown)}
            markdownStyle={markdownStyle}
            onLinkPress={({ url }) => Linking.openURL(url)}
          />
          <AppText className="mt-8 border-t border-separator pt-4 text-xs text-muted">
            {entry.source.attributionText}
          </AppText>
        </View>
      </Animated.ScrollView>

      {/* The bar window: same photo, same offset, clipped to the bar. */}
      <View pointerEvents="box-none" className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: barH }}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {photoEl}
          <Animated.View style={[StyleSheet.absoluteFill, barShade]} className="bg-cover-scrim/35" />
        </View>
        <View className="flex-1 flex-row items-center gap-3 px-4" style={{ paddingTop: insets.top }}>
          <BackButton onCover />
          <Animated.View className="flex-1" style={barTitle}>
            <AppText numberOfLines={1} className="font-semibold text-cover-ink">
              {entry.title}
            </AppText>
          </Animated.View>
          <AaButton onPress={onOpenAa} />
        </View>
        {/* Reading progress hairline. */}
        <Animated.View style={[{ height: 2, transformOrigin: 'left' }, readBar]} className="bg-cover-ink/80" />
      </View>

      <BackToTop
        scrollY={y}
        endAt={contentH > viewH ? contentH - viewH - 40 : Number.POSITIVE_INFINITY}
        bottom={insets.bottom + 16}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: !reduced })}
      />
    </View>
  );
}
