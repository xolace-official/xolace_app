/**
 * PROTOTYPE — throwaway (#396). Browse A–Z: every subject, grouped by letter,
 * with counts. `?letter=` jumps to that section (C's letter strip).
 */
import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Pressable, SectionList, View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { ENTRIES, SUBJECTS } from '@/src/features/library/prototype-home/mock-library';
import { openList } from '@/src/features/library/prototype-home/parts';
import { Glyph } from '@/src/features/library/prototype-reader/shared';

const SECTIONS = [...new Set(SUBJECTS.map((s) => s[0]))].map((l) => ({ title: l, data: SUBJECTS.filter((s) => s[0] === l) }));

export default function LibrarySubjectsPrototypeRoute() {
  const { letter } = useLocalSearchParams<{ letter?: string }>();
  const ref = useRef<SectionList<string>>(null);
  const start = Math.max(0, SECTIONS.findIndex((s) => s.title === letter));

  return (
    <>
      <Stack.Screen options={{ title: 'Subjects', headerLargeTitle: false, headerBackButtonDisplayMode: 'minimal' }} />
      <SectionList
        ref={ref}
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        sections={SECTIONS}
        keyExtractor={(s) => s}
        stickySectionHeadersEnabled
        onLayout={() => start && ref.current?.scrollToLocation({ sectionIndex: start, itemIndex: 0, animated: false })}
        onScrollToIndexFailed={() => {}}
        renderSectionHeader={({ section }) => (
          <View className="bg-background px-4 pb-1 pt-4">
            <AppText className="text-accent text-[13px] font-bold">{section.title}</AppText>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable onPress={() => openList(`subject=${encodeURIComponent(item)}`)} className="border-border mx-4 flex-row items-center border-b py-3.5 active:opacity-60">
            <AppText className="flex-1 text-[17px]">{item}</AppText>
            <AppText className="text-muted pr-2 text-[14px]">{ENTRIES.filter((e) => e.subject === item).length}</AppText>
            <Glyph name="chevron.right" size={12} />
          </Pressable>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </>
  );
}
