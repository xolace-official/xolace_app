import { useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BottomSheet } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/reflect/pill-button';
import { BottomSheetBlurOverlay } from '@/src/components/bottom-sheet-blur-overlay';
import type { Id } from '../../../convex/_generated/dataModel';

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
          <Animated.View
            entering={FadeIn.duration(300)}
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
          </Animated.View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
