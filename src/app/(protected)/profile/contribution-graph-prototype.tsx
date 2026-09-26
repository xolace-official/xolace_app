// PROTOTYPE — throwaway (#429). Open /profile/contribution-graph-prototype?v=year|blend|season
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/src/components/shared/app-text';
import { buildHeatmapCalendar, HeatmapChart, type HeatmapCell } from '@/src/components/ui/heatmap-chart';
import { useTokenColor } from '@/src/features/profile/hooks/use-token-color';
import { FrozenCells } from '@/src/features/profile/prototype-contribution-graph/frozen-cells';
import {
  breadth, breakdown, currentStreak, fullCreditCount, mockYear,
} from '@/src/features/profile/prototype-contribution-graph/mock-activity';
import { isSameDay } from '@/src/lib/date';

const VARIANTS = {
  year: 'A · Year, reflect only',
  blend: 'B · Year, all actions + frozen',
  season: 'C · 16 weeks, fill + frozen',
} as const;
type Variant = keyof typeof VARIANTS;

const DAYS = mockYear();
const FROZEN = DAYS.filter((day) => day.frozen).map((day) => day.date);

export default function ContributionGraphPrototype() {
  const { v } = useLocalSearchParams<{ v?: Variant }>();
  const variant: Variant = v && v in VARIANTS ? v : 'year';
  const router = useRouter();
  const [held, setHeld] = useState<HeatmapCell | null>(null);
  const accent = useTokenColor('accent');
  const ember = useTokenColor('ember');
  const empty = useTokenColor('default');
  const ice = useTokenColor('tone-direct');

  const reflectOnly = variant === 'year';
  const days = variant === 'season' ? DAYS.slice(-16 * 7) : DAYS;
  const data = buildHeatmapCalendar(
    days.map((day) => ({ date: day.date, count: reflectOnly ? (day.counts.reflect ?? 0) : breadth(day) })),
    { end: new Date() }
  );
  const heldDay = held?.date ? DAYS.find((day) => isSameDay(day.date, held.date)) : undefined;
  const streak = currentStreak(DAYS);
  const activeDays = days.filter((day) => fullCreditCount(day) > 0).length;

  const header = (
    <HeatmapChart.Header
      title={reflectOnly ? 'Reflections this year' : variant === 'season' ? 'Last 16 weeks' : 'Showing up this year'}
      value={heldDay ? breakdown(heldDay) : variant === 'season' ? `${streak}-day streak` : `${activeDays} days`}
      caption={heldDay ? heldDay.date.toDateString() : 'Hold a day to read it'}
      legend
    />
  );

  const chart = (
    <HeatmapChart
      data={data}
      levels={reflectOnly ? undefined : [1, 2, 3, 4]}
      layout={variant === 'season' ? 'fill' : 'fluid'}
      binSize={12}
      gap={variant === 'season' ? 4 : 3}
      cornerRadius={variant === 'season' ? 4 : 2}
      color={variant === 'season' ? ember : accent}
      emptyColor={empty}
      inactiveOpacity={0.5}
      onActiveCellChange={setHeld}
    >
      {header}
      <HeatmapChart.XAxis />
      <HeatmapChart.YAxis labelFormat={variant === 'season' ? 'initial' : 'full'} />
      <HeatmapChart.Cells />
      {!reflectOnly && <FrozenCells dates={FROZEN} color={ice} />}
      <HeatmapChart.Tooltip
        className="bg-overlay border-default"
        activateAfterLongPress={variant === 'season' ? 0 : 180}
        formatLabel={(cell) => {
          const day = DAYS.find((d) => isSameDay(d.date, cell.date));
          return day ? breakdown(day) : `${cell.count}`;
        }}
      />
    </HeatmapChart>
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Graph prototype' }} />
      <ScrollView contentContainerClassName="gap-4 p-5 pb-40">
        <AppText className="text-xs text-muted">PROTOTYPE — throwaway, fake data. {VARIANTS[variant]}</AppText>
        <View className="rounded-3xl bg-surface p-4">
          {variant === 'season' ? chart : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              ref={(ref) => { ref?.scrollToEnd({ animated: false }); }}>
              {chart}
            </ScrollView>
          )}
          {!reflectOnly && (
            <AppText className="pt-2 text-xs text-muted">Outlined blue = freeze used that day. Quote reactions not shaded.</AppText>
          )}
        </View>
      </ScrollView>
      <View className="absolute inset-x-4 bottom-10 flex-row gap-2 rounded-2xl bg-overlay p-2">
        {(Object.keys(VARIANTS) as Variant[]).map((key) => (
          <Pressable key={key} onPress={() => { setHeld(null); router.setParams({ v: key }); }}
            className={`flex-1 items-center rounded-xl py-2 ${key === variant ? 'bg-accent' : ''}`}>
            <AppText className={key === variant ? 'text-accent-foreground' : 'text-foreground'}>{key.toUpperCase()}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
