import * as Linking from 'expo-linking';
import * as Updates from 'expo-updates';
import { BottomSheet, Button } from 'heroui-native';
import type { FC } from 'react';
import { Platform, View } from 'react-native';
import { BottomSheetBlurOverlay } from '@/src/components/bottom-sheet-blur-overlay';
import { APP_STORE_URL, PLAY_MARKET_URL } from '@/src/lib/constants/links';

export type UpdateBottomSheetMode = 'new-version' | 'ota-update';

type Props = {
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
  mode: UpdateBottomSheetMode;
};

const CONTENT: Record<UpdateBottomSheetMode, { title: string; description: string; primaryLabel: string }> = {
  'new-version': {
    title: 'New Version Available',
    description: 'A newer version is available on the App Store. Update to get the latest features and improvements.',
    primaryLabel: 'Download Now',
  },
  'ota-update': {
    title: 'Update Ready',
    description: 'New updates are ready. The app needs a quick refresh to apply them (no download required).',
    primaryLabel: 'Refresh Now',
  },
};

export const UpdateBottomSheet: FC<Props> = ({ isOpen, onOpenChange, mode }) => {
  const { title, description, primaryLabel } = CONTENT[mode];

  const handlePrimaryPress = () => {
    if (mode === 'new-version') {
      const storeLink = Platform.select({ ios: APP_STORE_URL, android: PLAY_MARKET_URL });
      if (storeLink) Linking.openURL(storeLink);
    } else {
      Updates.reloadAsync();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/20"
        >
          <View className="mb-8 gap-2 items-center">
            <BottomSheet.Title className="text-center">{title}</BottomSheet.Title>
            <BottomSheet.Description className="text-center">{description}</BottomSheet.Description>
          </View>
          <View className="gap-3">
            <Button size="lg" onPress={handlePrimaryPress} className="w-full">
              {primaryLabel}
            </Button>
            <Button variant="tertiary" size="lg" onPress={() => onOpenChange(false)} className="w-full">
              Later
            </Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
