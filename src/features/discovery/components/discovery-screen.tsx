import { ScrollView, View } from 'react-native';

import { CohortCard } from './cohort-card';
import { DiscoveryHeader } from './discovery-header';
import { DailyQuotesCard } from './daily-quotes-card';
import { DiscoveryTimelineSection } from './discovery-timeline-section';
import { DOCK_CLEARANCE, ReflectDock } from './reflect-dock';

/**
 * First tab. The masthead runs under the status bar, so this screen opts out of
 * both the stack header (see `_layout.tsx`) and automatic content insets, and
 * pads the safe area itself.
 */
export function DiscoveryScreen() {
  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        alwaysBounceVertical={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: DOCK_CLEARANCE + 30 }}
      >
        <DiscoveryHeader />

        {/* Wide gap: Flux's feet and his glow overhang the cohort card's box,
          * so gap-3 read as almost nothing under him. */}
        <View className="gap-10 px-4 pt-10">
          <CohortCard />
          <DailyQuotesCard />
        </View>

        <DiscoveryTimelineSection />
      </ScrollView>

      <ReflectDock />
    </View>
  );
}
