/**
 * PROTOTYPE ROUTE — issue #273. Throwaway. Not linked from anywhere in the app.
 *
 * Three variants of the kindling (path) screen on one route, switched by
 * `?variant=A|B|C`; `?state=active|loading|empty` previews the non-happy paths.
 * Open with:  open-url  exp+xolace://kindling-prototype?variant=A
 *
 * When a variant wins: fold it into the real (protected)/kindling/ route, then
 * delete this file and src/features/_prototype-kindling/. Capture the full set
 * on a throwaway branch per the prototype skill.
 */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { VariantA } from '@/src/features/_prototype-kindling/variant-a';
import { VariantB } from '@/src/features/_prototype-kindling/variant-b';
import { VariantC } from '@/src/features/_prototype-kindling/variant-c';
import {
  PrototypeSwitcher,
  type VariantKey,
} from '@/src/features/_prototype-kindling/switcher';
import type { PreviewState } from '@/src/features/_prototype-kindling/mock';

export default function KindlingPrototype() {
  const params = useLocalSearchParams<{ variant?: string; state?: string }>();
  const variant = (
    ['A', 'B', 'C'].includes(params.variant ?? '') ? params.variant : 'A'
  ) as VariantKey;
  const preview = (
    ['active', 'loading', 'empty'].includes(params.state ?? '')
      ? params.state
      : 'active'
  ) as PreviewState;

  return (
    <View className="flex-1 bg-background">
      {variant === 'A' && <VariantA preview={preview} />}
      {variant === 'B' && <VariantB preview={preview} />}
      {variant === 'C' && <VariantC preview={preview} />}
      <PrototypeSwitcher current={variant} state={preview} />
    </View>
  );
}
