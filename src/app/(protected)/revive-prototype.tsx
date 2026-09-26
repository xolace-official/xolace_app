// PROTOTYPE — throwaway (#431). Open /revive-prototype?v=card|banner|moment
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/src/components/shared/app-text';
import {
  BannerVariant, CardVariant, MomentVariant, ReviveSheet, type Sim,
} from '@/src/features/reflect/prototype-revive/variants';

const VARIANTS = {
  card: { label: 'A · Card cools, tap → sheet', C: CardVariant },
  banner: { label: 'B · Inline banner, exact hours', C: BannerVariant },
  moment: { label: 'C · One-time full-screen moment', C: MomentVariant },
} as const;
type Variant = keyof typeof VARIANTS;

const INITIAL: Sim = {
  savers: 1, hoursLeft: 31, priorStreak: 14, best: 22, nextMilestone: 30, revived: false, dismissed: false,
};

const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} className={`rounded-full px-3 py-1.5 ${on ? 'bg-accent' : 'bg-surface'}`}>
    <AppText className={`text-xs ${on ? 'text-accent-foreground' : 'text-foreground'}`}>{label}</AppText>
  </Pressable>
);

export default function RevivePrototype() {
  const { v } = useLocalSearchParams<{ v?: Variant }>();
  const variant: Variant = v && v in VARIANTS ? v : 'card';
  const router = useRouter();
  const [sim, setSim] = useState<Sim>(INITIAL);
  const [sheet, setSheet] = useState(false);
  const set = (patch: Partial<Sim>) => setSim((s) => ({ ...s, ...patch }));
  const { C, label } = VARIANTS[variant];

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Revive prototype' }} />
      <ScrollView contentContainerClassName="gap-4 p-5 pt-20 pb-40">
        <AppText className="text-xs text-muted">PROTOTYPE — throwaway, fake state. {label}</AppText>

        <View className="gap-2">
          <AppText className="text-xs text-muted">Streak savers</AppText>
          <View className="flex-row gap-2">
            {([0, 1] as const).map((n) => (
              <Chip key={n} label={String(n)} on={sim.savers === n} onPress={() => set({ savers: n })} />
            ))}
          </View>
          <AppText className="text-xs text-muted">Hours left in 48h window</AppText>
          <View className="flex-row gap-2">
            {[44, 31, 12, 3].map((h) => (
              <Chip key={h} label={`${h}h`} on={sim.hoursLeft === h} onPress={() => set({ hoursLeft: h })} />
            ))}
            <Chip label="Reset" on={false} onPress={() => { setSim(INITIAL); setSheet(false); }} />
          </View>
        </View>

        <C sim={sim} revive={() => set({ revived: true })} dismiss={() => set({ dismissed: true })} openSheet={() => setSheet(true)} />

        <AppText className="font-mono text-[10px] text-muted">{JSON.stringify(sim)}</AppText>
      </ScrollView>

      {sheet && (
        <ReviveSheet sim={sim} revive={() => { set({ revived: true }); setSheet(false); }} close={() => setSheet(false)} />
      )}

      <View className="absolute inset-x-4 bottom-10 flex-row gap-2 rounded-2xl bg-overlay p-2">
        {(Object.keys(VARIANTS) as Variant[]).map((key) => (
          <Pressable key={key} onPress={() => { setSim(INITIAL); setSheet(false); router.setParams({ v: key }); }}
            className={`flex-1 items-center rounded-xl py-2 ${key === variant ? 'bg-accent' : ''}`}>
            <AppText className={key === variant ? 'text-accent-foreground' : 'text-foreground'}>{key.toUpperCase()}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
