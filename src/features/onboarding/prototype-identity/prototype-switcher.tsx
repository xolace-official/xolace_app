/**
 * PROTOTYPE — throwaway. Ticket #198.
 * Deliberately ugly and high-contrast so it never reads as part of the design.
 * Dev-only: never rendered in a production build.
 */
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { AppText } from '@/src/components/shared/app-text';

export const VARIANTS = [
  { key: 'A', name: 'One Fire, Many Angles' },
  { key: 'B', name: 'Embers in the Dark' },
  { key: 'C', name: 'The Journal Page' },
  { key: 'D', name: 'The Tale, on Cards' },
  { key: 'E', name: 'The Tale, in the Dark' },
] as const;

export type VariantKey = (typeof VARIANTS)[number]['key'];

export const PrototypeSwitcher = ({
  current,
  onChange,
}: {
  current: VariantKey;
  onChange: (key: VariantKey) => void;
}) => {
  const insets = useSafeAreaInsets();
  if (!__DEV__) return null;

  const i = VARIANTS.findIndex((v) => v.key === current);
  const cycle = (dir: number) => onChange(VARIANTS[(i + dir + VARIANTS.length) % VARIANTS.length].key);

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, alignItems: 'center', zIndex: 999 }}
    >
      <View className="flex-row items-center gap-2 rounded-full bg-danger px-2 py-1.5">
        <Pressable onPress={() => cycle(-1)} className="px-2">
          <SymbolView name="chevron.left" size={13} tintColor="#ffffff" />
        </Pressable>
        <AppText className="text-[11px]" style={{ color: '#ffffff' }}>
          {current} — {VARIANTS[i].name}
        </AppText>
        <Pressable onPress={() => cycle(1)} className="px-2">
          <SymbolView name="chevron.right" size={13} tintColor="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
};
