/**
 * PROTOTYPE ROUTE — throwaway, ticket #200 (slide 1 only).
 *
 * Three compositions of beat 1, copy held constant so only layout and light
 * vary. Run: xolace://prototype-slide1?v=1|2|3 or tap the dev pill.
 */
import { Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/src/components/shared/app-text';
import { CompClose } from '@/src/features/onboarding/prototype-identity/slide1/comp-close';
import { CompEmber } from '@/src/features/onboarding/prototype-identity/slide1/comp-ember';
import { CompInverted } from '@/src/features/onboarding/prototype-identity/slide1/comp-inverted';

const COMPS = [
  { v: '1', name: 'Close to the fire' },
  { v: '2', name: 'The one lit thing' },
  { v: '3', name: 'Held at the top' },
] as const;

export default function PrototypeSlide1Route() {
  const params = useLocalSearchParams<{ v?: string; fire?: string }>();
  const useVideo = params.fire === 'video';
  const v = params.v ?? '1';
  const insets = useSafeAreaInsets();
  const i = Math.max(0, COMPS.findIndex((c) => c.v === v));

  return (
    <>
      <StatusBar hidden />
      <View className="flex-1 bg-background">
        {v === '1' && <CompClose />}
        {v === '2' && <CompEmber />}
        {v === '3' && <CompInverted video={useVideo} />}

        {__DEV__ ? (
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, alignItems: 'center' }}
          >
            <Pressable
              onPress={() => router.setParams({ v: COMPS[(i + 1) % COMPS.length].v })}
              className="rounded-full bg-danger px-4 py-1.5"
            >
              <AppText className="text-[11px]" style={{ color: '#ffffff' }}>
                {COMPS[i].v} — {COMPS[i].name}  ›
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </>
  );
}
