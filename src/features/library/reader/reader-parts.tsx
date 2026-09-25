import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { AppText } from '@/src/components/shared/app-text';
import { cn } from '@/src/lib/utils';
import { creditLine } from './reader-copy';
import type { ReaderEntry } from './reader-screen';
import { useRecord } from './use-read-signals';

const BACK_ICON = { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' } as const;
const AA_ICON = { ios: 'textformat.size', android: 'text_fields', web: 'text_fields' } as const;
const SAVE_ICON = { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' } as const;
const SAVED_ICON = { ios: 'bookmark.fill', android: 'bookmark_added', web: 'bookmark_added' } as const;
const SOURCE_ICON = { ios: 'building.columns', android: 'account_balance', web: 'account_balance' } as const;

// A share link opens the reader with nothing under it.
const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(protected)'));

/** Round back control; on the cover photo it takes the fixed cover ink. */
export function BackButton({ onCover = false }: { onCover?: boolean }) {
  const coverInk = String(useCSSVariable('--color-cover-ink'));
  const foreground = useThemeColor('foreground');
  return (
    <Pressable
      onPress={goBack}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Back"
      className={cn(
        'h-10 w-10 items-center justify-center rounded-full active:opacity-60',
        onCover ? 'bg-cover-scrim/30' : 'bg-surface-secondary',
      )}
    >
      <SymbolView name={BACK_ICON} size={17} weight="semibold" tintColor={onCover ? coverInk : foreground} />
    </Pressable>
  );
}

/** Opens the Aa sheet. Sits on the cover photo, so it takes the fixed cover ink. */
export function AaButton({ onPress }: { onPress: () => void }) {
  const coverInk = String(useCSSVariable('--color-cover-ink'));
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Reading appearance"
      className="h-10 w-10 items-center justify-center rounded-full bg-cover-scrim/30 active:opacity-60"
    >
      <SymbolView name={AA_ICON} size={17} weight="semibold" tintColor={coverInk} />
    </Pressable>
  );
}

/**
 * "I want this back" (#410): a plain toggle on the entry, same on the cards
 * and in the reader. On a cover photo it takes the fixed cover ink.
 */
export function SaveButton({ entryId, saved, onCover = false }: { entryId: ReaderEntry['_id']; saved: boolean; onCover?: boolean }) {
  const record = useRecord();
  // Cards' `saved` comes from list queries the optimistic update can't reach:
  // hold the tapped value until the server answers, and take no second tap.
  const [pending, setPending] = useState<boolean | null>(null);
  const shown = pending ?? saved;
  const coverInk = String(useCSSVariable('--color-cover-ink'));
  const foreground = useThemeColor('foreground');
  return (
    <Pressable
      disabled={pending !== null}
      onPress={() => {
        setPending(!shown);
        record({ entryId, saved: !shown }).finally(() => setPending(null));
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Save"
      accessibilityState={{ selected: shown }}
      className={cn(
        'h-10 w-10 items-center justify-center rounded-full active:opacity-60',
        onCover && 'bg-cover-scrim/30',
      )}
    >
      <SymbolView name={shown ? SAVED_ICON : SAVE_ICON} size={17} weight="semibold" tintColor={onCover ? coverInk : foreground} />
    </Pressable>
  );
}

type Credit = Pick<ReaderEntry, 'reuse' | 'author' | 'originalUrl' | 'source'>;

/** Who wrote it and how it reached this page. Every entry shows it (#383). */
export function SourceCredit({ entry }: { entry: Credit }) {
  const muted = useThemeColor('muted');
  const href = entry.originalUrl ?? entry.source.url;
  const line = [creditLine(entry.reuse), entry.author && `by ${entry.author}`].filter(Boolean).join(' · ');

  return (
    <Pressable
      disabled={!href}
      onPress={() => href && Linking.openURL(href)}
      accessibilityRole={href ? 'link' : undefined}
      accessibilityHint={href ? 'Opens the original' : undefined}
      className="flex-row items-center gap-3 active:opacity-70"
    >
      <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-surface-secondary">
        {entry.source.logoUrl ? (
          <Image source={{ uri: entry.source.logoUrl }} style={{ width: 36, height: 36 }} contentFit="cover" />
        ) : (
          <SymbolView name={SOURCE_ICON} size={15} tintColor={muted} />
        )}
      </View>
      <View className="flex-1">
        <AppText className="font-semibold text-sm">{entry.source.name}</AppText>
        <AppText className="text-xs text-muted">{line}</AppText>
      </View>
    </Pressable>
  );
}
