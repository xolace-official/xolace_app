/**
 * PROTOTYPE — throwaway (#396). B — "Index": text-first, no carousels. A
 * kind filter scopes the whole page; Continue is compact rows with time left;
 * hubs are a numbered typographic contents list; A–Z closes the page as a
 * subject cloud. Reads like a contents page, not a storefront.
 */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { Glyph } from '@/src/features/library/prototype-reader/shared';
import { HUBS, KINDS, SUBJECTS, bySlug, type Kind } from './mock-library';
import { EntryRow, SERIF, SectionTitle, ReadingAsCard, openEntry, openList, openSubjects } from './parts';
import type { HomeProps } from './home-state';

const FILTERS: { key: Kind | 'all'; label: string }[] = [{ key: 'all', label: 'All' }, ...KINDS.map((k) => ({ key: k.kind, label: k.label }))];

export function VariantBIndex(p: HomeProps) {
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const keep = (k: Kind) => kind === 'all' || kind === k;

  return (
    <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 160 }}>
      <View>{p.showReadingAs && <ReadingAsCard audiences={p.audiences} toggle={p.toggleAudience} onDone={p.dismissReadingAs} />}</View>

      <View className="bg-background">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
          {FILTERS.map((f) => {
            const on = f.key === kind;
            return (
              <Pressable key={f.key} onPress={() => setKind(f.key)} className={on ? 'bg-foreground rounded-full px-4 py-2' : 'bg-surface-secondary rounded-full px-4 py-2'}>
                <AppText className={on ? 'text-background text-[14px] font-semibold' : 'text-[14px] font-medium'}>{f.label}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {p.continueEntries.filter((e) => keep(e.kind)).length > 0 && (
        <>
          <SectionTitle title="Continue" />
          {p.continueEntries.filter((e) => keep(e.kind)).map((e) => (
            <Pressable key={e.slug} onPress={() => openEntry(e.slug)} className="mx-4 mb-2 gap-2 rounded-[18px] bg-surface p-4 active:opacity-80">
              <AppText className="text-[16px] font-semibold" numberOfLines={1}>{e.title}</AppText>
              <View className="flex-row items-center gap-3">
                <View className="bg-surface-tertiary h-1 flex-1 overflow-hidden rounded-full">
                  <View className="bg-accent h-full" style={{ width: `${e.progress! * 100}%` }} />
                </View>
                <AppText className="text-muted text-[12px]">{Math.ceil(e.readMin * (1 - e.progress!))} min left</AppText>
              </View>
            </Pressable>
          ))}
        </>
      )}

      {p.forYou.filter((f) => keep(f.entry.kind)).length > 0 && (
        <>
          <SectionTitle title="For you" />
          {p.forYou.filter((f) => keep(f.entry.kind)).map(({ entry, reason }) => (
            <EntryRow key={entry.slug} entry={entry} isPlus={p.isPlus} reason={reason} />
          ))}
        </>
      )}

      <SectionTitle title="Hubs" />
      {HUBS.map((hub, i) => {
        const n = hub.entries.filter((s) => keep(bySlug(s).kind)).length;
        if (!n) return null;
        return (
          <Pressable key={hub.slug} onPress={() => openList(`hub=${hub.slug}`)} className="border-border mx-4 flex-row items-baseline gap-4 border-b py-4 active:opacity-70">
            <AppText style={[SERIF, { fontSize: 28 }]} className="text-muted w-9">{String(i + 1).padStart(2, '0')}</AppText>
            <View className="flex-1 gap-1">
              <AppText style={[SERIF, { fontSize: 19, lineHeight: 24 }]} className="font-bold">{hub.title}</AppText>
              <AppText className="text-muted text-[13px]">{n} {kind === 'all' ? 'entries' : KINDS.find((k) => k.kind === kind)!.label.toLowerCase()}{hub.audioOnly && kind === 'all' ? ` · ${hub.audioOnly} to listen` : ''}</AppText>
            </View>
            <Glyph name="chevron.right" size={12} />
          </Pressable>
        );
      })}

      <SectionTitle title="Subjects" action="A–Z" onAction={() => openSubjects()} />
      <View className="flex-row flex-wrap gap-2 px-4">
        {SUBJECTS.map((s) => (
          <Pressable key={s} onPress={() => openList(`subject=${encodeURIComponent(s)}${kind === 'all' ? '' : `&kind=${kind}`}`)} className="border-border rounded-full border px-3.5 py-2 active:opacity-60">
            <AppText className="text-[14px]">{s}</AppText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
