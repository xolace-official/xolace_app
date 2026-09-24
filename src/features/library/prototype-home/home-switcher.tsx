/**
 * PROTOTYPE — throwaway (#396). Floating switcher above the tab bar: variant,
 * Plus/Free (the PLUS mark on meta lines) and New/Returning reader. Dev-only.
 */
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/shared/app-text';

export type HomeVariant = 'A' | 'B' | 'C';
const LABELS: Record<HomeVariant, string> = { A: 'A — Shelves', B: 'B — Index', C: 'C — Fireside' };
const ORDER: HomeVariant[] = ['A', 'B', 'C'];

function Toggle({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable hitSlop={8} onPress={onPress} className="rounded-full bg-white/15 px-2 py-0.5">
      <AppText className="text-[10px] font-semibold text-white">{label}</AppText>
    </Pressable>
  );
}

export function HomeSwitcher({ current, isPlus, returning }: { current: HomeVariant; isPlus: boolean; returning: boolean }) {
  const { bottom } = useSafeAreaInsets();
  if (!__DEV__) return null;

  const cycle = (dir: 1 | -1) =>
    router.setParams({ variant: ORDER[(ORDER.indexOf(current) + dir + ORDER.length) % ORDER.length] });

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ bottom: bottom + 64 }}>
      <View className="flex-row items-center gap-3 rounded-full bg-black/85 px-3 py-2">
        <Pressable hitSlop={10} onPress={() => cycle(-1)}>
          <AppText className="px-1 text-lg text-white">‹</AppText>
        </Pressable>
        <AppText className="text-xs font-semibold text-white">{LABELS[current]}</AppText>
        <Pressable hitSlop={10} onPress={() => cycle(1)}>
          <AppText className="px-1 text-lg text-white">›</AppText>
        </Pressable>
        <Toggle label={isPlus ? 'Plus ✓' : 'Free'} onPress={() => router.setParams({ plus: isPlus ? '0' : '1' })} />
        <Toggle label={returning ? 'Returning' : 'New'} onPress={() => router.setParams({ reader: returning ? 'new' : 'returning' })} />
      </View>
    </View>
  );
}
