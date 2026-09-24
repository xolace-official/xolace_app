/**
 * PROTOTYPE — throwaway (#396). A — "Shelves": editorial, image-led. Continue
 * leads as one big photo card, For you is a row of tall photo cards, hubs are a
 * paged carousel, kinds are Flux tiles, A–Z is a single row at the bottom.
 */
import { Image } from 'expo-image';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { FLUX, Glyph } from '@/src/features/library/prototype-reader/shared';
import { HUBS, KINDS } from './mock-library';
import { EntryRow, HubCarousel, ReadingAsCard, SectionTitle, UpNextCard, openList, openSubjects } from './parts';
import type { HomeProps } from './home-state';

export const KIND_FLUX = { explainer: FLUX.writer, advice: FLUX.campfire, story: FLUX.pair };

export function VariantAShelves(p: HomeProps) {
  const { width } = useWindowDimensions();
  const [lead, ...rest] = p.continueEntries;

  return (
    <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 160 }}>
      {p.showReadingAs && <ReadingAsCard audiences={p.audiences} toggle={p.toggleAudience} onDone={p.dismissReadingAs} />}

      {lead && (
        <>
          <SectionTitle title="Continue reading" />
          <View className="px-4">
            <UpNextCard entry={lead} kicker={`Continue · ${Math.round(lead.progress! * 100)}% read`} isPlus={p.isPlus} width={width - 32} height={340} />
          </View>
          {rest.map((e) => <EntryRow key={e.slug} entry={e} isPlus={p.isPlus} reason={`${Math.round(e.progress! * 100)}% read`} />)}
        </>
      )}

      {p.forYou.length > 0 && (
        <>
          <SectionTitle title="For you" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {p.forYou.map(({ entry, reason }) => (
              <UpNextCard key={entry.slug} entry={entry} kicker={reason} isPlus={p.isPlus} width={width * 0.68} height={320} />
            ))}
          </ScrollView>
        </>
      )}

      <SectionTitle title="Hubs" />
      <HubCarousel hubs={HUBS} />

      <SectionTitle title="By kind" />
      <View className="flex-row gap-3 px-4">
        {KINDS.map((k) => (
          <Pressable key={k.kind} onPress={() => openList(`kind=${k.kind}`)} className="bg-surface flex-1 items-center gap-2 rounded-[22px] px-2 pb-4 pt-3 active:opacity-80">
            <Image source={KIND_FLUX[k.kind]} style={{ width: 72, height: 72 }} contentFit="contain" />
            <AppText className="text-[15px] font-semibold">{k.label}</AppText>
            <AppText className="text-muted text-center text-[12px] leading-4">{k.line}</AppText>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => openSubjects()} className="bg-surface mx-4 mt-6 flex-row items-center gap-3 rounded-[18px] px-4 py-4 active:opacity-80">
        <Glyph name="textformat.abc" size={18} />
        <AppText className="flex-1 text-[16px] font-medium">Browse all subjects A–Z</AppText>
        <Glyph name="chevron.right" size={13} />
      </Pressable>
    </ScrollView>
  );
}
