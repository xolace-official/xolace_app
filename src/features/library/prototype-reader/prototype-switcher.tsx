/**
 * PROTOTYPE — throwaway (#395). Floating switcher for the reader variants,
 * plus a Plus on/off toggle so the 30s audio gate can be seen both ways.
 * Dev-only: renders nothing in production so a stray merge can't ship it.
 */
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/shared/app-text';

export type VariantKey = 'A' | 'B' | 'C';

const LABELS: Record<VariantKey, string> = {
  A: 'A — Cover fold',
  B: 'B — Quiet page',
  C: 'C — Listen dock',
};

const ORDER: VariantKey[] = ['A', 'B', 'C'];

export function PrototypeSwitcher({ current, isPlus }: { current: VariantKey; isPlus: boolean }) {
  const { top } = useSafeAreaInsets();
  if (!__DEV__) return null;

  const cycle = (dir: 1 | -1) => {
    const idx = ORDER.indexOf(current);
    router.setParams({ variant: ORDER[(idx + dir + ORDER.length) % ORDER.length] });
  };

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ top: top + 64 }}>
      <View className="flex-row items-center gap-3 rounded-full bg-black/85 px-3 py-2">
        <Pressable hitSlop={10} onPress={() => cycle(-1)}>
          <AppText className="px-1 text-lg text-white">‹</AppText>
        </Pressable>
        <AppText className="text-xs font-semibold text-white">{LABELS[current]}</AppText>
        <Pressable hitSlop={10} onPress={() => cycle(1)}>
          <AppText className="px-1 text-lg text-white">›</AppText>
        </Pressable>
        <Pressable
          hitSlop={8}
          onPress={() => router.setParams({ plus: isPlus ? '0' : '1' })}
          className="rounded-full bg-white/15 px-2 py-0.5"
        >
          <AppText className="text-[10px] font-semibold text-white">{isPlus ? 'Plus ✓' : 'Free'}</AppText>
        </Pressable>
      </View>
    </View>
  );
}
