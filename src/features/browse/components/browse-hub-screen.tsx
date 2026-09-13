import { useEffect } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';

type Entry = {
  id: 'support' | 'music' | 'topics';
  label: string;
  icon: string;
  bg: string;
  fg: '--color-browse-audio-foreground' | '--color-browse-music-foreground' | '--color-browse-topics-foreground';
  href: string;
};

const ENTRIES: Entry[] = [
  { id: 'support', label: 'Support audio', icon: 'waveform', bg: 'bg-browse-audio', fg: '--color-browse-audio-foreground', href: '/browse/list?family=support' },
  { id: 'music', label: 'Music', icon: 'music.note', bg: 'bg-browse-music', fg: '--color-browse-music-foreground', href: '/browse/list?family=music' },
  { id: 'topics', label: 'Topics', icon: 'square.grid.2x2', bg: 'bg-browse-topics', fg: '--color-browse-topics-foreground', href: '/browse/topics' },
];

function EntryButton({ entry }: { entry: Entry }) {
  const tint = useCSSVariable(entry.fg);

  return (
    <Pressable
      className="items-center gap-2"
      accessibilityRole="button"
      accessibilityLabel={entry.label}
      onPress={() => {
        playSoftPress();
        // #339 hasn't landed these routes yet — this slice (#338) only needs
        // the hub to point at the right destination.
        router.push(entry.href as never);
      }}
    >
      <View className={`h-16 w-16 items-center justify-center rounded-full ${entry.bg}`}>
        <SymbolView name={entry.icon as never} size={26} tintColor={String(tint)} />
      </View>
      <AppText className="text-xs font-medium">{entry.label}</AppText>
    </Pressable>
  );
}

/**
 * Browse hub (#338, docs/paths-v1.md §9.3) — entry row + New shelf. Open to
 * every signed-in user; the free-user gate is on playback, not browsing.
 */
export function BrowseHubScreen() {
  const { width } = useWindowDimensions();
  const posthog = usePostHog();
  const shelf = useQuery(api.browse.getNewShelf, {});

  useEffect(() => {
    posthog.capture('browse_opened');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featured = shelf?.[0];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="flex-row justify-around px-4 pt-6">
        {ENTRIES.map((entry) => (
          <EntryButton key={entry.id} entry={entry} />
        ))}
      </View>

      {featured && shelf && shelf.length > 0 && (
        <>
          <View className="px-4 pt-8">
            <AppText className="text-muted-foreground text-[13px] font-semibold uppercase tracking-wide">
              Featured this week
            </AppText>
            <AppText className="mt-0.5 text-2xl font-bold">{featured.title}</AppText>
            {featured.attribution && (
              <AppText className="text-muted-foreground mb-3 text-[15px]">{featured.attribution}</AppText>
            )}
            <Image
              source={{ uri: featured.thumbUrl }}
              style={{ width: width - 32, height: (width - 32) * 0.55, borderRadius: 14, marginTop: featured.attribution ? 0 : 8 }}
            />
          </View>

          <AppText className="px-4 pb-2 pt-8 text-[22px] font-bold">New</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}
          >
            {shelf.map((item) => (
              <View key={item._id} style={{ width: 170 }}>
                <Image source={{ uri: item.thumbUrl }} style={{ width: 170, height: 170, borderRadius: 10 }} />
                <AppText className="mt-1.5 text-[13px] font-medium" numberOfLines={1}>
                  {item.title}
                </AppText>
                {item.attribution && (
                  <AppText className="text-muted-foreground text-xs" numberOfLines={1}>
                    {item.attribution}
                  </AppText>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </ScrollView>
  );
}
