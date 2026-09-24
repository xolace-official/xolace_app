/**
 * PROTOTYPE — throwaway (#401). Aa sheet C — Reading modes.
 * No face / surface knobs: three named presets, each drawn as a little page in
 * its own look, plus size. Hyperlegible lives inside "Clear", not as a font name.
 */
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { cn } from '@/src/lib/utils';
import { AaSheetFrame, Label, SizeStepper, SurfaceScope, type AaSheetProps } from './aa-controls';
import { FACES, type Appearance } from './reader-appearance';

const MODES = [
  // #401 ruling: one face per mode — the app's own face, the hyperlegible face, the book serif.
  { key: 'classic', label: 'Classic', blurb: 'The app’s own face and theme', look: { face: 'spaceGrotesk', spacing: 'normal', surface: 'app' } },
  { key: 'clear', label: 'Clear', blurb: 'Hyperlegible, roomier lines, paper', look: { face: 'atkinson', spacing: 'loose', surface: 'paper' } },
  { key: 'fire', label: 'By the fire', blurb: 'A book serif, warm and dim for night', look: { face: 'literata', spacing: 'normal', surface: 'night' } },
] as const satisfies readonly { key: string; label: string; blurb: string; look: Omit<Appearance, 'size'> }[];

export function AaSheetModes({ isOpen, onClose, value, onChange }: AaSheetProps) {
  const active = MODES.find(
    (m) => m.look.face === value.face && m.look.spacing === value.spacing && m.look.surface === value.surface,
  );
  return (
    <AaSheetFrame isOpen={isOpen} onClose={onClose}>
      <Label>Reading mode</Label>
      <View className="flex-row gap-3">
        {MODES.map((m) => (
          <Pressable key={m.key} className="flex-1" onPress={() => onChange({ ...value, ...m.look })}>
            <SurfaceScope surface={m.look.surface}>
              <View
                className={cn(
                  'aspect-[3/4] justify-between rounded-2xl border bg-background p-3',
                  active?.key === m.key ? 'border-2 border-accent' : 'border-border',
                )}
              >
                <AppText style={{ fontFamily: FACES[m.look.face].bold, fontSize: 26 }}>Aa</AppText>
                <View style={{ gap: m.look.spacing === 'loose' ? 6 : 4 }}>
                  {[1, 0.85, 0.95, 0.6].map((w, i) => (
                    <View key={i} className="h-0.5 rounded-full bg-foreground/60" style={{ width: `${w * 100}%` }} />
                  ))}
                </View>
              </View>
            </SurfaceScope>
            <AppText className="mt-2 text-center font-semibold text-sm">{m.label}</AppText>
            <AppText className="text-center text-[11px] text-muted">{m.blurb}</AppText>
          </Pressable>
        ))}
      </View>

      <Label>Text size</Label>
      <SizeStepper size={value.size} onChange={(size) => onChange({ ...value, size })} />
    </AaSheetFrame>
  );
}
