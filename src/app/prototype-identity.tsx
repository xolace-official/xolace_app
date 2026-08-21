/**
 * PROTOTYPE ROUTE — throwaway, ticket #198.
 *
 * Three variants of Xolace's visual & motion identity for the superlist-style
 * carousel->auth screen, switchable via `?variant=A|B|C|D|E` and the red dev pill
 * at the top of the screen.
 *
 * Run:  bun expo start --ios   ->  open  xolace://prototype-identity?variant=A
 * Delete this file (and src/features/onboarding/prototype-identity/) once the
 * direction is picked.
 */
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { PressableFeedback } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';

import { useExpandGesture } from '@/src/features/onboarding/prototype-identity/use-expand-gesture';
import { VariantA } from '@/src/features/onboarding/prototype-identity/variant-a';
import { VariantB } from '@/src/features/onboarding/prototype-identity/variant-b';
import { VariantC } from '@/src/features/onboarding/prototype-identity/variant-c';
import { VariantD } from '@/src/features/onboarding/prototype-identity/variant-d';
import { VariantE } from '@/src/features/onboarding/prototype-identity/variant-e';
import {
  PrototypeSwitcher,
  type VariantKey,
} from '@/src/features/onboarding/prototype-identity/prototype-switcher';

export default function PrototypeIdentityRoute() {
  const params = useLocalSearchParams<{ variant?: string; sky?: string }>();
  const variant = (params.variant ?? 'A').toUpperCase() as VariantKey;
  // #200 option B — the dawn arc. Off by default so the pill flips A vs B.
  const sky = params.sky === '1';
  const controller = useExpandGesture();

  return (
    <>
      <StatusBar hidden />
      <View className="flex-1 bg-background">
        {variant === 'A' && <VariantA controller={controller} />}
        {variant === 'B' && <VariantB controller={controller} />}
        {variant === 'C' && <VariantC controller={controller} />}
        {/* D & E tell the tale — they own their own carousel + expansion state,
            so they take no `controller` (A/B/C's shared one must not change). */}
        {variant === 'D' && <VariantD />}
        {variant === 'E' && <VariantE sky={sky} />}
        <PrototypeSwitcher
          current={variant}
          onChange={(key) => router.setParams({ variant: key })}
        />
        {variant === 'E' ? (
          <PressableFeedback
            onPress={() => router.setParams({ sky: sky ? '0' : '1' })}
            className="absolute self-center rounded-full px-4 py-1.5 bg-black/55 border border-white/15"
            style={{ top: 96 }}
          >
            <AppText className="text-white/80 text-[11px]">
              {sky ? 'B · dawn arc' : 'A · night only'}
            </AppText>
          </PressableFeedback>
        ) : null}
      </View>
    </>
  );
}
