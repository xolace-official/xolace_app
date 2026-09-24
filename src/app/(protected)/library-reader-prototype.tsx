/**
 * PROTOTYPE — throwaway route for #395 (reader screen) and #401 (reader
 * typeface + Aa appearance sheet). Not linked from anywhere; open it directly:
 *   xolace://library-reader-prototype?aa=A&plus=0
 *
 * The reader is #395's chosen variant A (cover fold); the body now renders
 * through react-native-enriched-markdown. Tap the `Aa` button in the bar.
 * Three Aa sheets, switchable via `?aa=`:
 *   A — Quick:  size, Book vs Hyperlegible, page surface
 *   B — Studio: live preview, every face, size, line spacing, surface
 *   C — Modes:  three presets (Classic / Clear / By the fire) + size
 * Appearance is in-memory and shared across sheets, so switching keeps it.
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AaSheetQuick } from '@/src/features/library/prototype-reader/aa-sheet-a-quick';
import { AaSheetStudio } from '@/src/features/library/prototype-reader/aa-sheet-b-studio';
import { AaSheetModes } from '@/src/features/library/prototype-reader/aa-sheet-c-modes';
import { MOCK_ENTRY } from '@/src/features/library/prototype-reader/mock-entry';
import { PrototypeSwitcher, type AaKey } from '@/src/features/library/prototype-reader/prototype-switcher';
import { DEFAULT_APPEARANCE, useReaderFonts } from '@/src/features/library/prototype-reader/reader-appearance';
import { VariantACoverFold } from '@/src/features/library/prototype-reader/variant-a-cover-fold';

const SHEETS = { A: AaSheetQuick, B: AaSheetStudio, C: AaSheetModes };

export default function LibraryReaderPrototypeRoute() {
  const { aa, plus } = useLocalSearchParams<{ aa?: string; plus?: string }>();
  const current: AaKey = aa === 'B' || aa === 'C' ? aa : 'A';
  const isPlus = plus === '1';
  const Sheet = SHEETS[current];

  const fontsLoaded = useReaderFonts();
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!fontsLoaded) return <View className="flex-1 bg-background" />;

  return (
    <View className="flex-1 bg-background">
      <VariantACoverFold
        key={String(isPlus)}
        entry={MOCK_ENTRY}
        isPlus={isPlus}
        appearance={appearance}
        onAa={() => setSheetOpen(true)}
      />
      <PrototypeSwitcher current={current} isPlus={isPlus} appearance={appearance} />
      <Sheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} value={appearance} onChange={setAppearance} />
    </View>
  );
}
