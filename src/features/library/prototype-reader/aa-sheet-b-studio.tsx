/**
 * PROTOTYPE — throwaway (#401). Aa sheet B — Studio (Apple Books / Readwise).
 * Every knob: a live preview on top, the full face list (each name set in its
 * own face), size, line spacing, surface. Also the place to compare faces.
 */
import { Pressable, View } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

import { AppText } from '@/src/components/shared/app-text';
import { cn } from '@/src/lib/utils';
import { AaSheetFrame, Label, SizeStepper, SurfacePicker, SurfaceScope, type AaSheetProps } from './aa-controls';
import { FACES, SPACINGS, useMarkdownStyle, type FaceKey, type Spacing } from './reader-appearance';

const SAMPLE =
  'Your brain is not malfunctioning. It is doing what it was built to do: *scanning for problems* while there is finally room to scan. **Naming the loop** often loosens it.';

export function AaSheetStudio({ isOpen, onClose, value, onChange }: AaSheetProps) {
  return (
    <AaSheetFrame isOpen={isOpen} onClose={onClose} snap="88%">
      <SurfaceScope surface={value.surface}>
        <Preview value={value} />
      </SurfaceScope>

      <Label>Typeface</Label>
      <View className="overflow-hidden rounded-2xl bg-surface-secondary">
        {(Object.keys(FACES) as FaceKey[]).map((k, i) => {
          const on = value.face === k;
          return (
            <Pressable
              key={k}
              onPress={() => onChange({ ...value, face: k })}
              className={cn('flex-row items-center px-4 py-3 active:opacity-60', i > 0 && 'border-t border-border')}
            >
              <View className="flex-1">
                <AppText style={{ fontFamily: FACES[k].regular, fontSize: 18 }}>{FACES[k].label}</AppText>
                <AppText className="text-xs text-muted">{FACES[k].note}</AppText>
              </View>
              {on && <AppText className="font-semibold text-accent">✓</AppText>}
            </Pressable>
          );
        })}
      </View>

      <Label>Text size</Label>
      <SizeStepper size={value.size} onChange={(size) => onChange({ ...value, size })} />

      <Label>Line spacing</Label>
      <View className="flex-row gap-2">
        {(Object.keys(SPACINGS) as Spacing[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => onChange({ ...value, spacing: s })}
            className={cn(
              'flex-1 items-center rounded-xl border py-3',
              value.spacing === s ? 'border-2 border-accent' : 'border-border',
            )}
          >
            <SpacingGlyph gap={s === 'snug' ? 3 : s === 'normal' ? 5 : 7} />
            <AppText className="mt-1 text-xs capitalize text-muted">{s}</AppText>
          </Pressable>
        ))}
      </View>

      <Label>Page</Label>
      <SurfacePicker value={value.surface} onChange={(surface) => onChange({ ...value, surface })} />
    </AaSheetFrame>
  );
}

function Preview({ value }: { value: AaSheetProps['value'] }) {
  const style = useMarkdownStyle(value);
  return (
    <View className="rounded-2xl border border-border bg-background p-4">
      <EnrichedMarkdownText markdown={SAMPLE} markdownStyle={style} />
    </View>
  );
}

function SpacingGlyph({ gap }: { gap: number }) {
  return (
    <View style={{ gap }}>
      {[0, 1, 2].map((i) => (
        <View key={i} className="h-0.5 w-6 rounded-full bg-foreground" />
      ))}
    </View>
  );
}
