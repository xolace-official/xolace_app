/**
 * PROTOTYPE — throwaway (#396). Cards and rows the home variants share, so the
 * variants disagree about structure (what leads, what scrolls, what's a list),
 * not about the atoms. Card styles come from the references on #396.
 */
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { Glyph, useInk } from '@/src/features/library/prototype-reader/shared';
import { READING_FACE } from '@/src/features/library/prototype-reader/mock-entry';
import { AUDIENCES, type Entry, kindLabel } from './mock-library';

export const SERIF = { fontFamily: READING_FACE };
const SCRIM = ['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.78)'] as const; // ponytail: scrim stops, a --player-scrim token when real

/** Tier the home is showing, so pushed lists match it without threading params. */
export const protoTier = { isPlus: false };

export const openEntry = (_slug: string) => router.push('/library-reader-prototype?variant=A' as never);
export const openList = (q: string) => router.push(`/browse/library-prototype/list?${q}` as never);
export const openSubjects = (letter?: string) =>
  router.push(`/browse/library-prototype/subjects${letter ? `?letter=${letter}` : ''}` as never);

/** "4 min read · 6 min listen" + headphones; free users get the small Plus mark (#393). */
export function Meta({ entry, isPlus, onImage }: { entry: Entry; isPlus: boolean; onImage?: boolean }) {
  const muted = useInk('--muted');
  const tint = onImage ? 'rgba(255,255,255,0.75)' : muted;
  return (
    <View className="flex-row flex-wrap items-center gap-1.5">
      <AppText className={onImage ? 'text-[13px] text-white/75' : 'text-muted text-[13px]'}>
        {entry.readMin} min read · {entry.listenMin} min listen
      </AppText>
      <Glyph name="headphones" size={11} color={tint} />
      {!isPlus && (
        <View className={onImage ? 'rounded-full bg-white/20 px-1.5' : 'bg-accent/15 rounded-full px-1.5'}>
          <AppText className={onImage ? 'text-[10px] font-bold text-white' : 'text-accent text-[10px] font-bold'}>PLUS</AppText>
        </View>
      )}
    </View>
  );
}

/** Reference card 1: full-bleed photo, kicker, serif title, meta, round play. */
export function UpNextCard({ entry, kicker, isPlus, width, height = 300 }: {
  entry: Entry; kicker: string; isPlus: boolean; width: number; height?: number;
}) {
  return (
    <Pressable onPress={() => openEntry(entry.slug)} className="overflow-hidden rounded-[28px] active:opacity-90" style={{ width, height }}>
      <Image source={{ uri: entry.cover }} style={StyleSheet.absoluteFill} transition={200} />
      <LinearGradient colors={SCRIM} locations={[0.25, 0.5, 1]} style={StyleSheet.absoluteFill} />
      {/* Play sits top-right: tapping opens the reader, it doesn’t autoplay */}
      <View className="absolute right-4 top-4 h-10 w-10 items-center justify-center overflow-hidden rounded-full">
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <Glyph name="play.fill" size={15} color="white" />
      </View>
      <View className="flex-1 justify-end gap-2 p-5">
        <AppText className="text-[12px] font-medium uppercase tracking-[1.5px] text-white/70">{kicker}</AppText>
        <AppText style={[SERIF, { fontSize: 26, lineHeight: 31 }]} className="font-bold text-white" numberOfLines={3}>
          {entry.title}
        </AppText>
        <View className="pt-1">
          <Meta entry={entry} isPlus={isPlus} onImage />
        </View>
      </View>
      {entry.progress != null && (
        <View className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
          <View className="h-full bg-white" style={{ width: `${entry.progress * 100}%` }} />
        </View>
      )}
    </Pressable>
  );
}

/** Reference card 3: thumbnail left, "Kind · N min read" kicker, bold title. */
export function EntryRow({ entry, isPlus, reason }: { entry: Entry; isPlus: boolean; reason?: string }) {
  return (
    <Pressable onPress={() => openEntry(entry.slug)} className="flex-row items-center gap-4 px-4 py-3 active:opacity-70">
      <Image source={{ uri: entry.cover }} style={{ width: 104, height: 78, borderRadius: 14 }} transition={200} />
      <View className="flex-1 gap-1">
        <AppText className="text-muted text-[12px]">
          {reason ? `${reason} · ` : ''}{kindLabel(entry.kind)} · {entry.subject}
        </AppText>
        <AppText className="text-[16px] font-semibold leading-[21px]" numberOfLines={2}>{entry.title}</AppText>
        <Meta entry={entry} isPlus={isPlus} />
      </View>
    </Pressable>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-end justify-between px-4 pb-3 pt-8">
      <AppText className="text-[22px] font-bold">{title}</AppText>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText className="text-accent text-[15px] font-medium">{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}

/** The one-time "Reading as…" card (#393). Dismissing is a valid answer. */
export function ReadingAsCard({ audiences, toggle, onDone }: {
  audiences: string[]; toggle: (a: string) => void; onDone: () => void;
}) {
  return (
    <View className="bg-surface mx-4 mt-4 gap-3 rounded-[24px] p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-0.5">
          <AppText className="text-[17px] font-semibold">Reading as…</AppText>
          <AppText className="text-muted text-[14px]">Pick any that fit. It only shapes what’s picked for you.</AppText>
        </View>
        <Pressable onPress={onDone} hitSlop={10}>
          <Glyph name="xmark" size={14} color={useInk('--muted')} />
        </Pressable>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {AUDIENCES.map((a) => {
          const on = audiences.includes(a);
          return (
            <Pressable key={a} onPress={() => toggle(a)} className={on ? 'bg-accent rounded-full px-3.5 py-2' : 'bg-surface-secondary rounded-full px-3.5 py-2'}>
              <AppText className={on ? 'text-accent-foreground text-[14px] font-medium' : 'text-[14px] font-medium'}>{a}</AppText>
            </Pressable>
          );
        })}
      </View>
      {audiences.length > 0 && (
        <Pressable onPress={onDone} className="bg-foreground items-center rounded-full py-2.5">
          <AppText className="text-background text-[15px] font-semibold">Done</AppText>
        </Pressable>
      )}
    </View>
  );
}
