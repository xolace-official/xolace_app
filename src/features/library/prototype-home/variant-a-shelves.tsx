/**
 * PROTOTYPE — throwaway (#396). A — "Shelves": editorial, image-led. Continue
 * leads as one big photo card, For you is a centre-focus carousel (opal), hubs
 * are a paged carousel with stretch dots, then C's kind rows and A–Z strip.
 */
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { HUBS } from './mock-library';
import { EntryRow, ReadingAsCard, SectionTitle, UpNextCard } from './parts';
import { KindRows, LetterStrip } from './browse-sections';
import { ForYouCarousel } from './for-you-carousel';
import { HubCarousel } from './hub-carousel';
import type { HomeProps } from './home-state';

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
          <ForYouCarousel items={p.forYou} isPlus={p.isPlus} />
        </>
      )}

      <SectionTitle title="Hubs" />
      <HubCarousel hubs={HUBS} />

      <KindRows />
      <LetterStrip />
    </ScrollView>
  );
}
