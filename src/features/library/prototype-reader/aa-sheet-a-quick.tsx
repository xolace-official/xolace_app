/**
 * PROTOTYPE — throwaway (#401). Aa sheet A — Quick.
 * The fewest knobs: size, one reading face vs. hyperlegible, surface.
 * No preview; the page behind the sheet *is* the preview.
 */
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { cn } from '@/src/lib/utils';
import { AaSheetFrame, Label, SizeStepper, SurfacePicker, type AaSheetProps } from './aa-controls';
import { FACES, type FaceKey } from './reader-appearance';

const PAIR: FaceKey[] = ['literata', 'atkinson'];
const PAIR_LABEL: Record<string, string> = { literata: 'Book', atkinson: 'Hyperlegible' };

export function AaSheetQuick({ isOpen, onClose, value, onChange }: AaSheetProps) {
  return (
    <AaSheetFrame isOpen={isOpen} onClose={onClose}>
      <Label>Text size</Label>
      <SizeStepper size={value.size} onChange={(size) => onChange({ ...value, size })} />

      <Label>Typeface</Label>
      <View className="flex-row gap-2 rounded-2xl bg-surface-secondary p-1">
        {PAIR.map((k) => {
          const on = value.face === k;
          return (
            <Pressable
              key={k}
              onPress={() => onChange({ ...value, face: k })}
              className={cn('flex-1 items-center rounded-xl py-3', on && 'bg-background')}
            >
              <AppText style={{ fontFamily: FACES[k].regular, fontSize: 17 }}>{PAIR_LABEL[k]}</AppText>
            </Pressable>
          );
        })}
      </View>

      <Label>Page</Label>
      <SurfacePicker value={value.surface} onChange={(surface) => onChange({ ...value, surface })} />
    </AaSheetFrame>
  );
}
