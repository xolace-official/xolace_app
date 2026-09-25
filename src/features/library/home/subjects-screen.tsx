/**
 * Lantern A–Z (#396): every subject with active entries, grouped by letter,
 * with counts. `?letter=` jumps to that letter.
 */
import { useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';
import { useRef } from 'react';
import { Pressable, SectionList, View } from 'react-native';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { facetLabel } from './library-copy';

type Subject = { slug: string; count: number };

export function SubjectsScreen() {
  const { letter } = useLocalSearchParams<{ letter?: string }>();
  const home = useQuery(api.library.home.getHome, {});
  const ref = useRef<SectionList<Subject>>(null);
  const muted = useThemeColor('muted');

  const subjects = home?.subjects ?? [];
  const sections = [...new Set(subjects.map((s) => s.slug[0].toUpperCase()))].map((title) => ({
    title,
    data: subjects.filter((s) => s.slug[0].toUpperCase() === title),
  }));
  const start = sections.findIndex((s) => s.title === letter);

  return (
    <SectionList
      ref={ref}
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      sections={sections}
      keyExtractor={(s) => s.slug}
      stickySectionHeadersEnabled
      onContentSizeChange={() => {
        if (start > 0) ref.current?.scrollToLocation({ sectionIndex: start, itemIndex: 0, animated: false });
      }}
      onScrollToIndexFailed={() => {}}
      renderSectionHeader={({ section }) => (
        <View className="bg-background px-4 pb-1 pt-4">
          <AppText className="text-[13px] font-bold text-accent">{section.title}</AppText>
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${facetLabel(item.slug)}, ${item.count}`}
          onPress={() => router.push({ pathname: '/browse/library/subject/[slug]', params: { slug: item.slug } })}
          className="mx-4 flex-row items-center border-b border-border py-3.5 active:opacity-60"
        >
          <AppText className="flex-1 text-[17px]">{facetLabel(item.slug)}</AppText>
          <AppText className="pr-2 text-[14px] text-muted">{item.count}</AppText>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={12} tintColor={muted} />
        </Pressable>
      )}
      contentContainerStyle={{ paddingBottom: 120 }}
    />
  );
}
