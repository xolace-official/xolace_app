/**
 * PROTOTYPE ROUTE — throwaway, ticket #200 (slide 1 only).
 *
 * Three compositions of beat 1, copy held constant so only layout and light
 * vary. Reach it from Settings → Account → Dev tools (deep links resolve to
 * the preview build on a physical device, so the in-app entry is the only
 * reliable way in there).
 *
 * The dev pill has two halves: left cycles the composition, right cycles the
 * fire source (stand-in / real video / Skia shader).
 */
import { Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ScopedTheme } from 'uniwind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/src/components/shared/app-text';
import { CompClose } from '@/src/features/onboarding/prototype-identity/slide1/comp-close';
import { CompEmber } from '@/src/features/onboarding/prototype-identity/slide1/comp-ember';
import { CompInverted } from '@/src/features/onboarding/prototype-identity/slide1/comp-inverted';

const COMPS = [
  { v: '1', name: 'Close to the fire' },
  { v: '2', name: 'One lit thing' },
  { v: '3', name: 'Held at the top' },
] as const;

const FIRES = ['video', 'shader', 'skia'] as const;
type Fire = (typeof FIRES)[number];

export default function PrototypeSlide1Route() {
  const params = useLocalSearchParams<{ v?: string; fire?: string }>();
  const v = params.v ?? '3';
  const fire = (FIRES.includes(params.fire as Fire) ? params.fire : 'video') as Fire;
  const insets = useSafeAreaInsets();
  const i = Math.max(0, COMPS.findIndex((c) => c.v === v));
  const f = FIRES.indexOf(fire);

  return (
    <>
      <StatusBar hidden />
      {/* Same pin as the deck — slide 1 is a night surface regardless of the
          phone's theme, so it must not read the user's palette. */}
      <ScopedTheme theme="dark">
      <View className="flex-1 bg-background">
        {v === '1' && <CompClose />}
        {v === '2' && <CompEmber />}
        {v === '3' && <CompInverted fire={fire} />}

        {__DEV__ ? (
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, alignItems: 'center' }}
          >
            <View className="flex-row items-center rounded-full bg-danger overflow-hidden">
              <Pressable
                onPress={() => router.setParams({ v: COMPS[(i + 1) % COMPS.length].v, fire })}
                className="px-3 py-1.5"
              >
                <AppText className="text-[11px]" style={{ color: '#ffffff' }}>
                  {COMPS[i].v} · {COMPS[i].name}
                </AppText>
              </Pressable>
              <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: '#ffffff55' }} />
              <Pressable
                onPress={() => router.setParams({ v, fire: FIRES[(f + 1) % FIRES.length] })}
                className="px-3 py-1.5"
              >
                <AppText className="text-[11px]" style={{ color: '#ffffff' }}>
                  🔥 {fire}
                </AppText>
              </Pressable>
              <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: '#ffffff55' }} />
              <Pressable onPress={() => router.back()} className="px-3 py-1.5">
                <AppText className="text-[11px]" style={{ color: '#ffffff' }}>
                  ✕
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
      </ScopedTheme>
    </>
  );
}
