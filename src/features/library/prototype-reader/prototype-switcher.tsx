/**
 * PROTOTYPE — throwaway (#395, #401). Floating switcher: cycles the Aa sheet
 * variants (#401 — the reader itself is #395's variant A), a Plus on/off
 * toggle for the 30s audio gate, and prints the live appearance state.
 * Dev-only: renders nothing in production so a stray merge can't ship it.
 */
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/shared/app-text';
import { FACES, type Appearance } from './reader-appearance';

export type AaKey = 'A' | 'B' | 'C';

const LABELS: Record<AaKey, string> = {
  A: 'Aa A — Quick',
  B: 'Aa B — Studio',
  C: 'Aa C — Modes',
};

const ORDER: AaKey[] = ['A', 'B', 'C'];

export function PrototypeSwitcher({ current, isPlus, appearance }: { current: AaKey; isPlus: boolean; appearance: Appearance }) {
  const { top } = useSafeAreaInsets();
  if (!__DEV__) return null;

  const cycle = (dir: 1 | -1) => {
    const idx = ORDER.indexOf(current);
    router.setParams({ aa: ORDER[(idx + dir + ORDER.length) % ORDER.length] });
  };

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ top: top + 64 }}>
      <View className="items-center rounded-2xl bg-black/85 px-3 py-2">
        <View className="flex-row items-center gap-3">
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
        <AppText className="text-[10px] text-white/70">
          {FACES[appearance.face].label} · {appearance.size}pt · {appearance.spacing} · {appearance.surface}
        </AppText>
      </View>
    </View>
  );
}
