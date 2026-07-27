import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { SymbolView } from 'expo-symbols';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';

const CARD_STYLE = { borderCurve: 'continuous' as const };

/**
 * First tab. The explicit card `replace`s back to reflect ("/") so the user
 * never accumulates a back stack between the tab surface and the idle screen.
 */
export function DiscoveryScreen() {
  const router = useRouter();
  const accent = useThemeColor('accent');

  const goToReflect = () => {
    playSoftPress();
    router.replace('/');
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="p-5 gap-4"
    >
      <AppText className="text-sm text-foreground/60">
        Placeholder — exploration lives here.
      </AppText>

      <PressableFeedback
        onPress={goToReflect}
        accessibilityRole="button"
        accessibilityLabel="Return to reflect"
      >
        <View
          className="flex-row items-center gap-4 rounded-3xl bg-surface border border-border/40 p-5"
          style={CARD_STYLE}
        >
          <View className="flex-1">
            <AppText className="text-base font-medium text-foreground">
              What&apos;s here right now?
            </AppText>
            <AppText className="text-sm text-foreground/55 mt-0.5">
              Go back to reflect
            </AppText>
          </View>
          <SymbolView name="arrow.right" size={18} tintColor={accent} />
        </View>
      </PressableFeedback>
    </ScrollView>
  );
}
