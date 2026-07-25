import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { SymbolView } from 'expo-symbols';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });

/** Shown to listeners whose profile isn't published yet — the only entry into setup. */
export function ListenerSetupBanner() {
  const router = useRouter();
  const accent = useThemeColor('accent');

  return (
    <View className="px-4 pt-3">
      <PressableFeedback
        onPress={() => {
          playSoftPress();
          router.push('/listener-setup' as never);
        }}
        accessibilityRole="button"
        accessibilityLabel="Set up your listener profile"
      >
        <View
          className="flex-row items-center gap-3 rounded-3xl border border-accent/25 bg-accent/8 p-4"
          style={styles.borderCurve}
        >
          <View className="flex-1">
            <AppText className="text-sm font-semibold text-foreground">
              Set up your listener profile
            </AppText>
            <AppText className="text-xs text-muted mt-0.5">
              People can&apos;t find you until it&apos;s published.
            </AppText>
          </View>
          <SymbolView name="arrow.right" size={16} tintColor={accent} />
        </View>
      </PressableFeedback>
    </View>
  );
}
