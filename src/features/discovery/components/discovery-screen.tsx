import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DiscoveryHeader } from './discovery-header';
import { DailyQuotesCard } from './daily-quotes-card';
import { DOCK_CLEARANCE, ReflectDock } from './reflect-dock';

/**
 * First tab. The masthead runs under the status bar, so this screen opts out of
 * both the stack header (see `_layout.tsx`) and automatic content insets, and
 * pads the safe area itself.
 */
export function DiscoveryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        // Nothing below the fold yet — bouncing on a screen that doesn't
        // overflow just exposes the background behind the masthead.
        alwaysBounceVertical={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + DOCK_CLEARANCE }}
      >
        <DiscoveryHeader />

        <View className="gap-3 px-4 pt-5">
          <DailyQuotesCard />
        </View>
      </ScrollView>

      <ReflectDock />
    </View>
  );
}
