import { View } from 'react-native';
import { BottomSheet, Button } from 'heroui-native';
import { BottomSheetBlurOverlay } from '@/src/components/bottom-sheet-blur-overlay';
import { AppText } from '@/src/components/shared/app-text';
import { useOtaUpdate } from '@/src/helpers/hooks/use-ota-update';
import { useVersionCheck } from '@/src/helpers/hooks/use-version-check';

const SNAP_POINTS = ['40%'];

export const UpdateBottomSheets = () => {
  const ota = useOtaUpdate();
  const version = useVersionCheck();

  return (
    <>
      {/* OTA / refresh sheet */}
      <BottomSheet isOpen={ota.isSheetOpen} onOpenChange={(open) => !open && ota.dismiss()}>
        <BottomSheet.Portal>
          <BottomSheetBlurOverlay />
          <BottomSheet.Content
            snapPoints={SNAP_POINTS}
            enableOverDrag={false}
            enableDynamicSizing={false}
            backgroundClassName="bg-background"
            handleIndicatorClassName="bg-foreground/20"
          >
            <View className="px-6 pt-4 pb-8 gap-6">
              <View className="gap-2 items-center">
                <AppText className="text-xl font-semibold text-foreground text-center">
                  Update Ready
                </AppText>
                <AppText className="text-sm font-light leading-6 text-foreground/50 text-center">
                  New updates are ready. The app needs a quick refresh to apply them (no download required).
                </AppText>
              </View>
              <View className="gap-3">
                <Button variant="primary" size="lg" onPress={ota.confirm} className="w-full">
                  Refresh Now
                </Button>
                <Button variant="ghost" size="lg" onPress={ota.dismiss} className="w-full">
                  <Button.Label className="text-foreground/50">Later</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Store version update sheet */}
      <BottomSheet isOpen={version.isSheetOpen} onOpenChange={(open) => !open && version.dismiss()}>
        <BottomSheet.Portal>
          <BottomSheetBlurOverlay />
          <BottomSheet.Content
            snapPoints={SNAP_POINTS}
            enableOverDrag={false}
            enableDynamicSizing={false}
            backgroundClassName="bg-background"
            handleIndicatorClassName="bg-foreground/20"
          >
            <View className="px-6 pt-4 pb-8 gap-6">
              <View className="gap-2 items-center">
                <AppText className="text-xl font-semibold text-foreground text-center">
                  New Version Available
                </AppText>
                <AppText className="text-sm font-light leading-6 text-foreground/50 text-center">
                  A new version of Xolace is available with the latest features and improvements.
                </AppText>
              </View>
              <View className="gap-3">
                <Button variant="primary" size="lg" onPress={version.confirm} className="w-full">
                  Update Now
                </Button>
                <Button variant="ghost" size="lg" onPress={version.dismiss} className="w-full">
                  <Button.Label className="text-foreground/50">Later</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  );
};
