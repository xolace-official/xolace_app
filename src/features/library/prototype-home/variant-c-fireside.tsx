/**
 * PROTOTYPE — throwaway (#396). C — "Fireside": leads with what the reader is
 * carrying, not with the catalogue. For you is grouped by *why* (the emotion
 * they named / who they're reading as); Continue is a slim bookmark; hubs are
 * book spines on a shelf; kinds are three big rows; A–Z is a letter strip.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { FLUX, Glyph } from '@/src/features/library/prototype-reader/shared';
import { HUBS } from './mock-library';
import { ReadingAsCard, SERIF, SectionTitle, UpNextCard, openEntry, openList } from './parts';
import { KindRows, LetterStrip } from './browse-sections';
import type { HomeProps } from './home-state';

export function VariantCFireside(p: HomeProps) {
  const { width } = useWindowDimensions();
  const mark = p.continueEntries[0];
  const groups = [...new Set(p.forYou.map((f) => f.reason))].map((reason) => ({
    reason,
    items: p.forYou.filter((f) => f.reason === reason),
  }));

  return (
    <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 160 }}>
      {/* Hearth: what you're carrying → the subjects that speak to it */}
      <View className="bg-surface mx-4 mt-2 flex-row items-center gap-3 overflow-hidden rounded-[28px] p-5">
        <View className="flex-1 gap-3">
          <AppText style={[SERIF, { fontSize: 24, lineHeight: 29 }]} className="font-bold">
            {p.emotions.length ? 'For what you’ve been carrying' : 'Pull up a seat'}
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {(p.emotions.length ? p.emotions : ['Sleep', 'Stress', 'Loneliness']).map((e) => (
              <Pressable key={e} onPress={() => openList(`${p.emotions.length ? 'emotion' : 'subject'}=${encodeURIComponent(e)}`)} className="bg-accent/15 rounded-full px-3 py-1.5">
                <AppText className="text-accent text-[14px] font-medium">{e}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
        <Image source={FLUX.campfire} style={{ width: 96, height: 96 }} contentFit="contain" />
      </View>

      {mark && (
        <Pressable onPress={() => openEntry(mark.slug)} className="mx-4 mt-3 flex-row items-center gap-3 rounded-full bg-surface-secondary py-2 pl-2 pr-4 active:opacity-80">
          <Image source={{ uri: mark.cover }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          <View className="flex-1">
            <AppText className="text-muted text-[11px] font-semibold uppercase tracking-wide">Pick up where you left off</AppText>
            <AppText className="text-[14px] font-medium" numberOfLines={1}>{mark.title}</AppText>
          </View>
          <Glyph name="bookmark.fill" size={14} />
        </Pressable>
      )}

      {p.showReadingAs && <ReadingAsCard audiences={p.audiences} toggle={p.toggleAudience} onDone={p.dismissReadingAs} />}

      {groups.map((g) => (
        <View key={g.reason}>
          <SectionTitle title={g.reason} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {g.items.map(({ entry }) => (
              <UpNextCard key={entry.slug} entry={entry} kicker={entry.kind === 'story' ? 'Story' : entry.subject} isPlus={p.isPlus} width={width * 0.62} height={260} />
            ))}
          </ScrollView>
        </View>
      ))}

      <SectionTitle title="On the shelf" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
        {HUBS.map((hub) => (
          <Pressable key={hub.slug} onPress={() => openList(`hub=${hub.slug}`)} className="overflow-hidden rounded-[18px] active:opacity-85" style={{ width: 132, height: 236 }}>
            <Image source={{ uri: hub.cover }} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
            <View className="flex-1 justify-end p-3">
              <AppText style={[SERIF, { fontSize: 18, lineHeight: 22 }]} className="font-bold text-white">{hub.title}</AppText>
              <AppText className="pt-1 text-[12px] text-white/70">{hub.entries.length + hub.audioOnly} pieces</AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <KindRows />
      <LetterStrip />
    </ScrollView>
  );
}
