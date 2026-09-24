/**
 * PROTOTYPE — throwaway (#395). Pieces every reader variant shares, so the
 * variants disagree only about the parts in question: header/cover, progress,
 * and the player.
 */
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { AppText } from '@/src/components/shared/app-text';
import { READING_FACE, type MockEntry } from './mock-entry';

/**
 * The one spring every variant uses: damping ratio ≈ 1 (30 / 2√220), so it
 * eases like a spring but never overshoots. Apply as
 * `.springify().damping(CALM.damping).stiffness(CALM.stiffness)`.
 */
/** Flux, for the end-of-entry designs. All transparent PNGs. */
export const FLUX = {
  campfire: require('@/assets/images/flux/flux-campfire.png'),
  writer: require('@/assets/images/flux/writer-flux.png'),
  pair: require('@/assets/images/flux/flux-pair-listening.png'),
};

export const CALM = { damping: 30, stiffness: 220 } as const;

export function useInk(token = '--color-foreground') {
  return String(useCSSVariable(token));
}

export function Glyph({ name, size = 18, color }: { name: SymbolViewProps['name']; size?: number; color?: string }) {
  const ink = useInk();
  return <SymbolView name={name} size={size} tintColor={color ?? ink} />;
}

/** Round frosted control — sits over a photo or over the page. */
export function GlassButton({
  name,
  label,
  onPress = () => {},
  onImage = false,
}: {
  name: SymbolViewProps['name'];
  label: string;
  onPress?: () => void;
  onImage?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center overflow-hidden rounded-full active:opacity-60"
    >
      <BlurView intensity={onImage ? 30 : 50} tint={onImage ? 'dark' : 'default'} style={StyleSheet.absoluteFill} />
      <Glyph name={name} size={17} color={onImage ? 'white' : undefined} />
    </Pressable>
  );
}

export const BackButton = (p: { onImage?: boolean }) => (
  <GlassButton name="chevron.left" label="Back" onPress={() => router.back()} {...p} />
);

export function KindAndTime({ entry, className }: { entry: MockEntry; className?: string }) {
  return (
    <AppText className={className ?? 'text-sm text-muted'}>
      {entry.kind[0].toUpperCase() + entry.kind.slice(1)} · {entry.readMin} min read · {entry.listenMin} min listen
    </AppText>
  );
}

export function SourceCredit({ entry }: { entry: MockEntry }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-secondary">
        <Glyph name="building.columns" size={15} />
      </View>
      <View className="flex-1">
        <AppText className="font-semibold text-sm">{entry.source.name}</AppText>
        <AppText className="text-xs text-muted">
          {entry.source.reuse === 'adapted' ? 'Adapted from their original guide' : 'Published with permission'}
        </AppText>
      </View>
    </View>
  );
}

/**
 * The body in the reading face: 18/28 (~1.55), left-aligned, space between
 * paragraphs, headings exposed as headers. `onSectionLayout` lets a variant
 * track which section is on screen.
 */
export function EntryBody({
  entry,
  onSectionLayout,
}: {
  entry: MockEntry;
  onSectionLayout?: (index: number, y: number) => void;
}) {
  return (
    <View className="gap-7">
      {entry.sections.map((s, i) => (
        <View
          key={s.id}
          className="gap-4"
          onLayout={(e: LayoutChangeEvent) => onSectionLayout?.(i, e.nativeEvent.layout.y)}
        >
          <AppText accessibilityRole="header" className="font-bold text-xl">
            {s.heading}
          </AppText>
          {s.paragraphs.map((p, j) => (
            <AppText key={j} selectable style={{ fontFamily: READING_FACE, fontSize: 18, lineHeight: 28 }}>
              {p}
            </AppText>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Shown in place of the transport once the 30s preview is spent. */
export function PlusUpsell({ compact = false }: { compact?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push('/(paywall)' as never)}
      className="flex-row items-center gap-2 rounded-full bg-accent px-4 py-2 active:opacity-80"
    >
      <Glyph name="sparkles" size={14} color={useInk('--color-accent-foreground')} />
      <AppText className="font-semibold text-sm text-accent-foreground">
        {compact ? 'Keep listening' : 'Preview ended · Keep listening with Plus'}
      </AppText>
    </Pressable>
  );
}
