/**
 * The Lantern home (#409): the Library's front page inside Browse, built from
 * #396's variant A. Top to bottom: Reading as… card (first visit) → For you →
 * Hubs → What kind of light → A–Z.
 *
 * Continue reading waits on engagement signals (#410) and search was ruled
 * out of v1 (#397), so neither renders yet.
 */
import { useMutation, useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { useEffect } from 'react';
import { ScrollView } from 'react-native';

import { api } from '@/convex/_generated/api';
import { KindRows, LetterStrip } from '@/src/features/library/home/browse-sections';
import { SectionTitle } from '@/src/features/library/home/entry-cards';
import { ForYouCarousel } from '@/src/features/library/home/for-you-carousel';
import { HubCarousel } from '@/src/features/library/home/hub-carousel';
import { reasonLine } from '@/src/features/library/home/library-copy';
import { ReadingAsCard, ReadingAsMenu } from '@/src/features/library/home/reading-as';

export function LibraryHomeScreen() {
  const posthog = usePostHog();
  const home = useQuery(api.library.home.getHome, {});
  const setReadingAs = useMutation(api.library.home.setReadingAs);

  useEffect(() => {
    posthog.capture('library_home_opened');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = home?.audiences.map((a) => a.slug) ?? [];
  const answer = (audiences: string[]) => void setReadingAs({ audiences });

  return (
    <>
      {/* first child, so the iOS large title collapses with this scroll view */}
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {home && (
          <>
            {home.readingAs === null && options.length > 0 && <ReadingAsCard options={options} onAnswer={answer} />}

            {home.forYou.length > 0 && (
              <>
                <SectionTitle title="For you" />
                <ForYouCarousel items={home.forYou.map((f) => ({ entry: f.entry, kicker: reasonLine(f.reason) }))} />
              </>
            )}

            {home.hubs.length > 0 && (
              <>
                <SectionTitle title="Hubs" />
                <HubCarousel hubs={home.hubs} />
              </>
            )}

            <KindRows />
            <LetterStrip />
          </>
        )}
      </ScrollView>
      {home && home.readingAs !== null && options.length > 0 && (
        <ReadingAsMenu options={options} value={home.readingAs} onChange={answer} />
      )}
    </>
  );
}
