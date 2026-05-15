import { useState } from 'react';
import { EaseView } from 'react-native-ease/uniwind';
import { BottomSheet } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/shared/pill-button';
import { BottomSheetBlurOverlay } from '@/src/components/bottom-sheet-blur-overlay';
import type { Id } from '@/convex/_generated/dataModel';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  swapsUsed: number;
  resetId: Id<'exercises'> | null;
  nextBestId: Id<'exercises'> | null;
  onKeepGoing: () => void;
  onSwap: (exerciseId: Id<'exercises'>) => void | Promise<void>;
};

export function SwapSheet({
  isOpen,
  onOpenChange,
  swapsUsed,
  resetId,
  nextBestId,
  onKeepGoing,
  onSwap,
}: Props) {
  const canSwap = swapsUsed < 2;
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwapPress = async (exerciseId: Id<'exercises'>) => {
    if (isSwapping) return;
    setIsSwapping(true);
    try {
      await onSwap(exerciseId);
    } catch {
      // swap errors are handled by the caller
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          snapPoints={['40%']}
          enableOverDrag={false}
          enableDynamicSizing={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/30"
        >
          <EaseView
            initialAnimate={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300, easing: [0.455, 0.03, 0.515, 0.955] }}
            className="gap-4 px-6 pb-8 pt-2"
          >
            <AppText className="text-center text-base font-medium text-foreground/60">
              Something else?
            </AppText>

            <PillButton label="Keep going" onPress={onKeepGoing} />

            {canSwap && resetId && (
              <PillButton
                label="Try something simpler"
                onPress={() => handleSwapPress(resetId)}
                disabled={isSwapping}
                className="border border-accent/20 bg-transparent"
              />
            )}

            {canSwap && nextBestId && (
              <PillButton
                label="Try something else"
                onPress={() => handleSwapPress(nextBestId)}
                disabled={isSwapping}
                className="border border-accent/20 bg-transparent"
              />
            )}
          </EaseView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
