/** PROTOTYPE — throwaway floating variant switcher for #273. Dev-only. */
import { router } from 'expo-router';
import { View, Pressable } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';

export const VARIANTS = ['A', 'B', 'C'] as const;
export type VariantKey = (typeof VARIANTS)[number];

const NAMES: Record<VariantKey, string> = {
  A: 'Devotional stack',
  B: 'Compact checklist',
  C: 'Focused spine',
};

const STATES = ['active', 'loading', 'empty'] as const;

export function PrototypeSwitcher({
  current,
  state,
}: {
  current: VariantKey;
  state: string;
}) {
  if (process.env.NODE_ENV === 'production') return null;

  const go = (v: VariantKey, s: string) =>
    router.setParams({ variant: v, state: s });

  const cycle = (dir: 1 | -1) => {
    const i = VARIANTS.indexOf(current);
    go(VARIANTS[(i + dir + VARIANTS.length) % VARIANTS.length], state);
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center pb-8"
    >
      <View className="flex-row items-center gap-1 rounded-full border border-foreground/15 bg-foreground px-2 py-1.5 shadow-lg">
        <Pressable onPress={() => cycle(-1)} hitSlop={10} className="px-2.5 py-1">
          <AppText className="text-background text-base">‹</AppText>
        </Pressable>
        <AppText className="text-background text-xs font-medium">
          {current} — {NAMES[current]}
        </AppText>
        <Pressable onPress={() => cycle(1)} hitSlop={10} className="px-2.5 py-1">
          <AppText className="text-background text-base">›</AppText>
        </Pressable>
        <View className="mx-1 h-4 w-px bg-background/25" />
        {STATES.map((s) => (
          <Pressable
            key={s}
            onPress={() => go(current, s)}
            hitSlop={6}
            className="px-1.5 py-1"
          >
            <AppText
              className={
                s === state
                  ? 'text-background text-[11px] font-semibold'
                  : 'text-background/45 text-[11px]'
              }
            >
              {s}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
