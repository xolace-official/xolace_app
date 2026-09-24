/**
 * PROTOTYPE — throwaway (#395). Variant B — Quiet page.
 *
 * No photo: the words are the cover. A typographic large title on the page
 * that hands over to a frosted bar (the library's own `ScrollHeader`), and one
 * floating pill that is both the reading progress and the player — so there
 * is only ever one object floating over the text.
 */
import { useState } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollHeader } from '@/src/components/ui/scroll-header';
import { READING_FACE, useMockPlayback, type MockEntry } from './mock-entry';
import { ProgressPill } from './progress-pill';
import { EndSignOff } from './end-sign-off';
import { BackButton, EntryBody, GlassButton, KindAndTime, SourceCredit } from './shared';

export function VariantBQuietPage({ entry, isPlus }: { entry: MockEntry; isPlus: boolean }) {
  const insets = useSafeAreaInsets();
  const playback = useMockPlayback(entry.listenMin * 60, isPlus);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const progress = useSharedValue(0);
  const contentH = useSharedValue(1);
  const viewH = useSharedValue(1);
  const [pct, setPct] = useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    const span = Math.max(contentH.get() - viewH.get(), 1);
    progress.set(Math.min(Math.max(e.contentOffset.y / span, 0), 1));
  });

  // Whole percents only: at most ~100 renders across a full read.
  useAnimatedReaction(
    () => Math.round(progress.get() * 100),
    (now, was) => {
      if (now !== was) runOnJS(setPct)(now);
    },
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollHeader className="flex-1" threshold={0.7}>
        <ScrollHeader.Bar surface="blur">
          <BackButton />
          <ScrollHeader.Title>{entry.title}</ScrollHeader.Title>
          <ScrollHeader.Actions>
            <GlassButton name="textformat.size" label="Appearance" />
            <GlassButton name="bookmark" label="Save" />
          </ScrollHeader.Actions>
        </ScrollHeader.Bar>
        <ScrollHeader.Large className="gap-3 px-6 pb-6">
          <KindAndTime entry={entry} className="text-xs uppercase tracking-widest text-muted" />
          <ScrollHeader.Title style={{ fontFamily: READING_FACE, fontSize: 34, lineHeight: 40 }}>
            {entry.title}
          </ScrollHeader.Title>
        </ScrollHeader.Large>

        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => viewH.set(e.nativeEvent.layout.height)}
          onContentSizeChange={(_, h) => contentH.set(h)}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          <View className="mb-8 border-y border-separator py-4">
            <SourceCredit entry={entry} />
          </View>
          <EntryBody entry={entry} />
          <EndSignOff entry={entry} bottomInset={insets.bottom + 120} />
        </Animated.ScrollView>
      </ScrollHeader>

      <ProgressPill
        entry={entry}
        pct={pct}
        progress={progress}
        playback={playback}
        bottom={insets.bottom + 16}
        onTop={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      />
    </View>
  );
}
