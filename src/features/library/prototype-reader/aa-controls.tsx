/**
 * PROTOTYPE — throwaway (#401). Controls the three Aa sheet variants share, so
 * they disagree only about *what* the sheet exposes and how it is organised.
 */
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheet } from 'heroui-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ScopedTheme, ScopedVariables } from 'uniwind';

import { BottomSheetBlurOverlay } from '@/src/components/bottom-sheet-blur-overlay';
import { AppText } from '@/src/components/shared/app-text';
import { cn } from '@/src/lib/utils';
import { SIZES, SURFACES, useSurface, type Appearance, type SurfaceKey } from './reader-appearance';

export type AaSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  value: Appearance;
  onChange: (next: Appearance) => void;
};

export function AaSheetFrame({
  isOpen,
  onClose,
  snap,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  snap?: string;
  children: ReactNode;
}) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          snapPoints={snap ? [snap] : undefined}
          enableDynamicSizing={!snap}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/30"
        >
          <BottomSheetScrollView contentContainerClassName="gap-6 px-6 pb-12 pt-2">{children}</BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <AppText className="text-xs uppercase tracking-widest text-muted">{children}</AppText>;
}

/** A− ●●●○○○ A+ — steps through the base sizes; the OS text size still multiplies them. */
export function SizeStepper({ size, onChange }: { size: number; onChange: (s: number) => void }) {
  const i = Math.max(SIZES.indexOf(size as (typeof SIZES)[number]), 0);
  const step = (d: number) => onChange(SIZES[Math.min(Math.max(i + d, 0), SIZES.length - 1)]);
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-surface-secondary px-2 py-1">
      <Pressable accessibilityLabel="Smaller text" hitSlop={8} onPress={() => step(-1)} className="px-3 py-2 active:opacity-50">
        <AppText className="text-sm">A</AppText>
      </Pressable>
      <View className="flex-1 flex-row justify-center gap-2">
        {SIZES.map((s, j) => (
          <View key={s} className={cn('h-1.5 w-1.5 rounded-full', j <= i ? 'bg-foreground' : 'bg-foreground/20')} />
        ))}
      </View>
      <Pressable accessibilityLabel="Larger text" hitSlop={8} onPress={() => step(1)} className="px-3 py-2 active:opacity-50">
        <AppText className="text-xl">A</AppText>
      </Pressable>
    </View>
  );
}

function SurfaceDot({ k, selected, onPress }: { k: SurfaceKey; selected: boolean; onPress: () => void }) {
  const { bg, ink } = useSurface(k);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={SURFACES[k]} className="items-center gap-1.5">
      <View
        className={cn('h-12 w-12 items-center justify-center rounded-full border', selected ? 'border-2 border-accent' : 'border-border')}
        style={{ backgroundColor: bg }}
      >
        <AppText style={{ color: ink }} className="text-base">
          Aa
        </AppText>
      </View>
      <AppText className={cn('text-xs', selected ? 'font-semibold' : 'text-muted')}>{SURFACES[k]}</AppText>
    </Pressable>
  );
}

export function SurfacePicker({ value, onChange }: { value: SurfaceKey; onChange: (s: SurfaceKey) => void }) {
  return (
    <View className="flex-row justify-between">
      {(Object.keys(SURFACES) as SurfaceKey[]).map((k) => (
        <SurfaceDot key={k} k={k} selected={value === k} onPress={() => onChange(k)} />
      ))}
    </View>
  );
}

/**
 * A reader surface = the light/dark base theme (so accent, surfaces, borders
 * stay coherent) with background / foreground / muted overridden by the
 * surface's warm tokens. Everything token-driven inside follows — body,
 * credit, end of entry — with no per-component wiring.
 */
export function SurfaceScope({ surface, children }: { surface: SurfaceKey; children: ReactNode }) {
  const { bg, ink, muted } = useSurface(surface);
  if (surface === 'app') return children;
  return (
    <ScopedTheme theme={surface === 'night' ? 'dark' : 'light'}>
      {/* Themes define `--background` etc.; `--color-*` is HeroUI's alias over
          them. Class names resolve through the source names, hooks through the
          alias — so override both. */}
      <ScopedVariables
        variables={{
          '--background': bg,
          '--foreground': ink,
          '--muted': muted,
          '--color-background': bg,
          '--color-foreground': ink,
          '--color-muted': muted,
        }}
      >
        {children}
      </ScopedVariables>
    </ScopedTheme>
  );
}
