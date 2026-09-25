/**
 * The Lantern home's atoms (#409, from #396 variant A): the photo card, the
 * thumbnail row and the section title. Every entry tap opens the one reader,
 * `library/[slug]` (#407).
 */
import type { FunctionReturnType } from 'convex/server';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { facetLabel, readTimeLine } from '@/src/features/library/home/library-copy';
import { COVER_SCRIM } from '@/src/features/library/reader/cover-palette';
import { capitalise } from '@/src/features/library/reader/reader-copy';
import { SaveButton } from '@/src/features/library/reader/reader-parts';
import type { ReaderFrom } from '@/src/features/library/analytics';

export type EntryItem = FunctionReturnType<typeof api.library.entries.listEntries>[number];

/** Photo cards' corner, shared with the For you blur that sits over them. */
export const CARD_RADIUS = 28;

export const readerHref = (slug: string, from: ReaderFrom) =>
  ({ pathname: '/library/[slug]', params: { slug, from } }) as const;

/** Full-bleed cover photo, kicker, title, meta. Ink is the reader cover's fixed palette. */
export function PhotoCard({
  entry,
  kicker,
  width,
  height,
}: {
  entry: EntryItem;
  kicker: string;
  width: number;
  height: number;
}) {
  // Save sits beside the link, not in it: a nested button is unreachable to
  // screen readers and, on web, a click inside the anchor follows it.
  return (
    <View style={{ width, height }}>
      <Link href={readerHref(entry.slug, 'home')} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${entry.title}. ${kicker}. ${readTimeLine(entry.readMin, entry.views, entry.listenMin)}`}
          className="overflow-hidden bg-cover-scrim active:opacity-90"
          style={{
            width,
            height,
            borderRadius: CARD_RADIUS,
            borderCurve: 'continuous',
          }}
        >
          {entry.coverUrl && (
            <Image
              source={{ uri: entry.coverUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          )}
          <LinearGradient
            colors={COVER_SCRIM.colors}
            locations={COVER_SCRIM.locations}
            style={StyleSheet.absoluteFill}
          />
          <View className="flex-1 justify-end gap-2 p-5">
            <AppText className="text-[12px] font-medium uppercase tracking-[1.5px] text-cover-ink/70">{kicker}</AppText>
            <AppText className="text-[24px] font-bold leading-[29px] text-cover-ink" numberOfLines={3}>
              {entry.title}
            </AppText>
            <AppText className="text-[13px] text-cover-ink/75">{readTimeLine(entry.readMin, entry.views, entry.listenMin)}</AppText>
          </View>
        </Pressable>
      </Link>
      <View className="absolute right-3 top-3">
        <SaveButton entryId={entry._id} saved={entry.saved} onCover />
      </View>
    </View>
  );
}

/** Thumbnail left, "Kind · Subject" kicker, bold title, meta. */
export function EntryRow({ entry, index, from }: { entry: EntryItem; index?: number; from: ReaderFrom }) {
  return (
    <View className="flex-row items-center pr-4">
      <Link href={readerHref(entry.slug, from)} asChild>
        <Pressable accessibilityRole="link" className="flex-1 flex-row items-center gap-4 py-3 pl-4 active:opacity-70">
          {index !== undefined && <AppText className="w-4 text-[13px] text-muted">{index + 1}</AppText>}
          <View className="overflow-hidden rounded-[14px] bg-surface-secondary" style={THUMB}>
            {entry.coverUrl && <Image source={{ uri: entry.coverUrl }} style={THUMB} transition={200} />}
          </View>
          <View className="flex-1 gap-1">
            <AppText className="text-[12px] text-muted">
              {capitalise(entry.kind)} · {facetLabel(entry.primarySubject)}
            </AppText>
            <AppText className="text-[16px] font-semibold leading-[21px]" numberOfLines={2}>
              {entry.title}
            </AppText>
            <AppText className="text-[13px] text-muted">{readTimeLine(entry.readMin, entry.views, entry.listenMin)}</AppText>
          </View>
        </Pressable>
      </Link>
      <SaveButton entryId={entry._id} saved={entry.saved} />
    </View>
  );
}

const THUMB = { width: 104, height: 78 };

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-end justify-between px-4 pb-3 pt-8">
      <AppText accessibilityRole="header" className="text-[22px] font-bold">
        {title}
      </AppText>
      {action && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <AppText className="text-[15px] font-medium text-accent">{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}
