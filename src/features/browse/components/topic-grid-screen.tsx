import { useEffect } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LegendList } from '@legendapp/list/react-native';
import { useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { Pressable, View, useWindowDimensions } from 'react-native';

import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';

type Topic = FunctionReturnType<typeof api.browse.getTopics>[number];

const GUTTER = 16;
const GAP = 12;

const keyExtractor = (t: Topic) => t.slug;

function countLine(t: Topic) {
  const parts = [];
  if (t.supportCount > 0) parts.push(`${t.supportCount} spoken`);
  if (t.musicCount > 0) parts.push(`${t.musicCount} music`);
  return parts.join(' · ');
}

/**
 * Topic grid (`topics`, §9.3) — a grid of *topics*, one tile per shared topic
 * with ≥ 1 active track in either family. Two-up, square artwork.
 */
export function TopicGridScreen() {
  const posthog = usePostHog();
  const topics = useQuery(api.browse.getTopics, {});
  const { width } = useWindowDimensions();
  const tile = (width - GUTTER * 2 - GAP) / 2;

  useEffect(() => {
    posthog.capture('browse_topics_opened');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LegendList
      data={topics ?? []}
      numColumns={2}
      keyExtractor={keyExtractor}
      estimatedItemSize={tile + 48}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: GUTTER - GAP / 2, paddingTop: 8, paddingBottom: 40 }}
      renderItem={({ item }) => (
        <Pressable
          className="active:opacity-60"
          style={{ width: tile, marginHorizontal: GAP / 2, marginBottom: GAP + 4 }}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${countLine(item)}`}
          onPress={() => {
            playSoftPress();
            router.push(`/browse/topic/${item.slug}` as never);
          }}
        >
          <View className="bg-surface-tertiary overflow-hidden rounded-xl" style={{ width: tile, height: tile }}>
            <Image source={{ uri: item.thumbUrl }} style={{ width: tile, height: tile }} />
          </View>
          <View className="mt-2">
            <AppText className="text-[15px] font-semibold" numberOfLines={1}>
              {item.title}
            </AppText>
            <AppText className="text-muted text-[13px]" numberOfLines={1}>
              {countLine(item)}
            </AppText>
          </View>
        </Pressable>
      )}
    />
  );
}
