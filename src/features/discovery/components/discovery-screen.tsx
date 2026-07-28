import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { DiscoveryHeader } from './discovery-header';
import { DailyQuotesCard } from './daily-quotes-card';

const CARD_STYLE = { borderCurve: 'continuous' as const };

/**
 * First tab. The masthead runs under the status bar, so this screen opts out of
 * both the stack header (see `_layout.tsx`) and automatic content insets and
 * pads the safe area itself.
 *
 * The reflect row `replace`s back to "/" so the user never accumulates a back
 * stack between the tab surface and the idle screen.
 */
export function DiscoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = useThemeColor('accent');

  const goToReflect = () => {
    playSoftPress();
    router.replace('/');
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
    >
      <DiscoveryHeader />

      <View className="gap-3 px-4 pt-5">
        <DailyQuotesCard />

        <PressableFeedback
          onPress={goToReflect}
          accessibilityRole="button"
          accessibilityLabel="Return to reflect"
        >
          <View
            className="flex-row items-center gap-4 rounded-3xl border border-border/40 bg-surface p-5"
            style={CARD_STYLE}
          >
            <View className="flex-1">
              <AppText className="text-base font-medium text-foreground">
                What&apos;s here right now?
              </AppText>
              <AppText className="mt-0.5 text-sm text-muted">Go back to reflect</AppText>
            </View>
            <SymbolView name="arrow.right" size={18} tintColor={accent as string} />
          </View>
        </PressableFeedback>
      </View>
    </ScrollView>
  );
}
