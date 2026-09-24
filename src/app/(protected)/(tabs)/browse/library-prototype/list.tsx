/**
 * PROTOTYPE — throwaway (#396). One browse list for hub / kind / subject /
 * emotion (`?hub=` `?kind=` `?subject=` `?emotion=`). Filters and sort live in
 * a native `Stack.Toolbar.Menu` (inline sections) — no custom filter sheet.
 */
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { ENTRIES, HUBS, KINDS, bySlug, type Kind } from '@/src/features/library/prototype-home/mock-library';
import { EntryRow, SERIF, protoTier } from '@/src/features/library/prototype-home/parts';

type Length = 'any' | 'quick' | 'long';
type Sort = 'editor' | 'helped' | 'short';

export default function LibraryListPrototypeRoute() {
  const { hub: hubSlug, kind: kindParam, subject, emotion } = useLocalSearchParams<{ hub?: string; kind?: Kind; subject?: string; emotion?: string }>();
  const { width } = useWindowDimensions();
  const [kind, setKind] = useState<Kind | 'all'>(kindParam ?? 'all');
  const [length, setLength] = useState<Length>('any');
  const [sort, setSort] = useState<Sort>('editor');

  const hub = HUBS.find((h) => h.slug === hubSlug);
  const base = hub
    ? hub.entries.map(bySlug)
    : ENTRIES.filter((e) => (subject ? e.subject === subject : emotion ? e.emotion === emotion : true));
  const rows = base
    .filter((e) => kind === 'all' || e.kind === kind)
    .filter((e) => length === 'any' || (length === 'quick' ? e.readMin <= 5 : e.readMin > 5))
    .sort((a, b) => (sort === 'helped' ? b.helped - a.helped : sort === 'short' ? a.readMin - b.readMin : 0));

  const title = hub ? '' : subject ?? (emotion ? `Feeling ${emotion}` : KINDS.find((k) => k.kind === kindParam)?.label ?? 'All');

  return (
    <>
      <Stack.Screen options={{ title, headerLargeTitle: false, headerBackButtonDisplayMode: 'minimal', headerTransparent: !!hub }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon={kind !== 'all' || length !== 'any' ? 'line.3.horizontal.decrease.circle.fill' : 'line.3.horizontal.decrease.circle'}>
          {!kindParam && (
            <Stack.Toolbar.Menu inline title="Kind">
              {[{ kind: 'all' as const, label: 'All kinds' }, ...KINDS].map((k) => (
                <Stack.Toolbar.MenuAction key={k.kind} isOn={kind === k.kind} onPress={() => setKind(k.kind)}>{k.label}</Stack.Toolbar.MenuAction>
              ))}
            </Stack.Toolbar.Menu>
          )}
          <Stack.Toolbar.Menu inline title="Length">
            <Stack.Toolbar.MenuAction isOn={length === 'any'} onPress={() => setLength('any')}>Any length</Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction isOn={length === 'quick'} onPress={() => setLength('quick')}>Quick reads · 5 min or less</Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction isOn={length === 'long'} onPress={() => setLength('long')}>Longer reads</Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
          <Stack.Toolbar.Menu inline title="Sort">
            <Stack.Toolbar.MenuAction isOn={sort === 'editor'} onPress={() => setSort('editor')}>{hub ? 'Editor’s order' : 'Newest'}</Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction isOn={sort === 'helped'} onPress={() => setSort('helped')}>Most helpful</Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction isOn={sort === 'short'} onPress={() => setSort('short')}>Shortest first</Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior={hub ? 'never' : 'automatic'} contentContainerStyle={{ paddingBottom: 120 }}>
        {hub && (
          <View>
            <Image source={{ uri: hub.cover }} style={{ width, height: width * 0.8 }} />
            <View className="gap-2 px-4 pb-2 pt-5">
              <AppText style={[SERIF, { fontSize: 30, lineHeight: 35 }]} className="font-bold">{hub.title}</AppText>
              <AppText className="text-muted text-[16px] leading-[22px]">{hub.blurb}</AppText>
              <AppText className="text-muted text-[13px]">{hub.entries.length} entries{hub.audioOnly ? ` · ${hub.audioOnly} to listen` : ''} · curated by Xolace</AppText>
            </View>
          </View>
        )}
        {rows.map((e, i) => (
          <View key={e.slug} className="flex-row items-center">
            {hub && sort === 'editor' && <AppText className="text-muted w-8 pl-4 text-[13px]">{i + 1}</AppText>}
            <View className="flex-1"><EntryRow entry={e} isPlus={protoTier.isPlus} /></View>
          </View>
        ))}
        {rows.length === 0 && (
          <AppText className="text-muted px-4 pt-12 text-center text-[15px]">Nothing like that here yet. Try another length or kind.</AppText>
        )}
      </ScrollView>
    </>
  );
}
