import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { cn } from '@/src/lib/utils';
import type { ReaderEntry } from './reader-screen';
import { useRecord } from './use-read-signals';

const HEART = { ios: 'heart', android: 'favorite_border', web: 'favorite_border' } as const;
const HEART_FILL = { ios: 'heart.fill', android: 'favorite', web: 'favorite' } as const;

/**
 * The end-of-read beat (#410): "This helped" — positive-only, undoable, no
 * negative counterpart. The public total shows only once the server lets it
 * (≥15, ADR 0016); below that `helpedCount` is null.
 */
export function EndOfRead({
  entryId,
  helped,
  helpedCount,
}: {
  entryId: ReaderEntry['_id'];
  helped: boolean;
  helpedCount: number | null;
}) {
  const record = useRecord();
  const accent = useThemeColor('accent');
  const muted = useThemeColor('muted');
  return (
    <View className="mt-10 items-center gap-3">
      <Pressable
        onPress={() => record({ entryId, helped: !helped })}
        accessibilityRole="button"
        accessibilityState={{ selected: helped }}
        accessibilityHint={helped ? 'Tap again to undo' : undefined}
        className={cn(
          'flex-row items-center gap-2 rounded-full px-5 py-3 active:opacity-70',
          helped ? 'bg-accent/15' : 'border border-border',
        )}
      >
        <SymbolView name={helped ? HEART_FILL : HEART} size={16} tintColor={helped ? accent : muted} />
        <AppText className={cn('font-medium text-[15px]', helped && 'text-accent')}>This helped</AppText>
      </Pressable>
      {helpedCount !== null && (
        <AppText className="text-xs text-muted">{helpedCount} found this helpful</AppText>
      )}
    </View>
  );
}
