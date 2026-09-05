import { useCallback, useEffect, useState } from "react";
import { BackHandler, View } from "react-native";
import { BottomSheet } from "heroui-native";
import { BottomSheetBlurOverlay } from "@/src/components/bottom-sheet-blur-overlay";
import { AppText } from "@/src/components/shared/app-text";
import type { Id } from "@/convex/_generated/dataModel";
import { ThoughtStack } from "@/src/features/quotes/components/archive/thought-stack";

const SNAP_POINTS = ["92%"];
/**
 * `BottomSheetView` is `position: absolute` with `top: 0` and no bottom, so it
 * sizes to its content — a list inside it has nothing to scroll within. Pinning
 * the bottom gives the stack the sheet's height.
 */
const CONTENT_CONTAINER_PROPS = { style: { bottom: 0 } } as const;

/**
 * The archive: a themed container holding fixed-tint cards (#305). The design's
 * hand-rolled overlay is not ported — a bare `BackHandler` around it does not
 * cooperate with Expo Router, and there is no gesture arbitration between its
 * dismiss pan and a stack that is itself a vertical scroll surface.
 *
 * The stack's scroller is gorhom's own `BottomSheetScrollView` (see
 * `thought-stack.tsx`), which is what supplies that arbitration: the list
 * scrolls, and a drag at its top pans the sheet.
 *
 * The design's flat 120pt dismiss threshold is not implemented. gorhom's only
 * seam for it is `gestureEventsHandlersHook`, which HeroUI already occupies to
 * track the drag state its overlay animation and its close propagation read —
 * overriding it trades a working sheet for a number. What ships is gorhom's
 * velocity-projected snap, which the flick that 120pt was reaching for hits
 * anyway.
 */
export function ArchiveSheet({
  isOpen,
  onClose,
  savedCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  savedCount: number;
}) {
  const [openId, setOpenId] = useState<Id<"daily_quotes"> | null>(null);

  // Every exit routes through here, so the sheet never reopens onto a card the
  // user already left open.
  const close = useCallback(() => {
    setOpenId(null);
    onClose();
  }, [onClose]);

  // Two-stage back, wired by hand: an open card collapses first, and only a
  // second press dismisses the sheet.
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (openId !== null) {
        setOpenId(null);
        return true;
      }
      close();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, openId, close]);

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          snapPoints={SNAP_POINTS}
          // One detent. Left on, gorhom derives a second one from the registered
          // scrollable's content height, and a flick up takes the sheet above 92%.
          enableDynamicSizing={false}
          enableOverDrag={false}
          contentContainerProps={CONTENT_CONTAINER_PROPS}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/20"
        >
          <View className="flex-1">
            <View className="gap-1 px-[22px] pb-2">
              <AppText className="font-poster-display text-[22px] tracking-[1.6px] text-foreground">
                OLD THOUGHTS
              </AppText>
              <AppText className="font-poster-body text-[12.5px] text-foreground/60">
                {savedCount} kept
              </AppText>
            </View>
            <ThoughtStack openId={openId} onToggle={setOpenId} />
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
