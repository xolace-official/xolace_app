import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { usePostHog } from 'posthog-react-native';
import { Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import type { FunctionReturnType } from 'convex/server';
import type { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';

export type TrackItem = FunctionReturnType<typeof api.browse.getTopic>[number];
export type BrowseFrom = 'family-list' | 'topic';

export const FAMILY_LABEL = { support: 'Support audio', music: 'Music' } as const;

const THUMB = 56;

/**
 * One catalogue row (§9.3): square artwork, title, one subtitle line. No
 * inline play — a tap opens the player (#340). `glyph` marks the family and
 * is only shown on the topic screen, the one list both families share.
 */
export function TrackRow({ track, from, glyph = false }: { track: TrackItem; from: BrowseFrom; glyph?: boolean }) {
  const posthog = usePostHog();
  const tint = useCSSVariable(
    track.family === 'music' ? '--color-browse-music-foreground' : '--color-browse-audio-foreground',
  );

  const subtitle =
    track.episodeNumber !== undefined
      ? `Episode ${track.episodeNumber}${track.attribution ? ` · ${track.attribution}` : ''}`
      : track.attribution;

  return (
    <Pressable
      className="flex-row items-center gap-3 pl-4 active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel={`${track.title}${subtitle ? `, ${subtitle}` : ''}`}
      onPress={() => {
        playSoftPress();
        posthog.capture('browse_track_opened', { slug: track.slug, family: track.family, from });
        router.push(`/browse/player?slug=${track.slug}` as never);
      }}
    >
      <View className="bg-surface-tertiary overflow-hidden rounded-lg" style={{ width: THUMB, height: THUMB }}>
        <Image source={{ uri: track.thumbUrl }} style={{ width: THUMB, height: THUMB }} />
      </View>
      <View className="border-border/60 flex-1 flex-row items-center gap-2 border-b py-3 pr-4" style={{ minHeight: THUMB + 12 }}>
        <View className="flex-1">
          <AppText className="text-[16px] font-medium" numberOfLines={1}>
            {track.title}
          </AppText>
          {subtitle && (
            <AppText className="text-muted mt-0.5 text-[13px]" numberOfLines={1}>
              {subtitle}
            </AppText>
          )}
        </View>
        {glyph && (
          <SymbolView
            name={track.family === 'music' ? 'music.note' : 'waveform'}
            size={16}
            tintColor={String(tint)}
            accessibilityLabel={track.family === 'music' ? 'Music' : 'Spoken'}
          />
        )}
      </View>
    </Pressable>
  );
}
