/**
 * PROTOTYPE — throwaway route for #395 (Library: reader screen prototype).
 * Not linked from anywhere; open it directly:
 *   router.push('/library-reader-prototype?variant=A')
 *
 * Three reader variants, switchable via `?variant=`, and `?plus=1|0` for the
 * audio gate:
 *   A — Cover fold: parallax cover folds into a photo bar, rounded body sheet,
 *       progress hairline, compact docked mini-player
 *   B — Quiet page: typographic ScrollHeader, one pill = progress + player
 *   C — Listen dock: inset cover card, section-aware bar, persistent dock
 */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { MOCK_ENTRY } from '@/src/features/library/prototype-reader/mock-entry';
import { PrototypeSwitcher, type VariantKey } from '@/src/features/library/prototype-reader/prototype-switcher';
import { VariantACoverFold } from '@/src/features/library/prototype-reader/variant-a-cover-fold';
import { VariantBQuietPage } from '@/src/features/library/prototype-reader/variant-b-quiet-page';
import { VariantCListenDock } from '@/src/features/library/prototype-reader/variant-c-listen-dock';

const VARIANTS = { A: VariantACoverFold, B: VariantBQuietPage, C: VariantCListenDock };

export default function LibraryReaderPrototypeRoute() {
  const { variant, plus } = useLocalSearchParams<{ variant?: string; plus?: string }>();
  const current: VariantKey = variant === 'B' || variant === 'C' ? variant : 'A';
  const isPlus = plus === '1';
  const Variant = VARIANTS[current];

  return (
    <View className="flex-1 bg-background">
      {/* keyed so switching variant or tier resets scroll + playback */}
      <Variant key={`${current}-${isPlus}`} entry={MOCK_ENTRY} isPlus={isPlus} />
      <PrototypeSwitcher current={current} isPlus={isPlus} />
    </View>
  );
}
