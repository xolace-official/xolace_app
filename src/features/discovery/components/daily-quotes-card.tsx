import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });

/**
 * Entry point to the quotes screen. Deliberately fetches nothing — it names
 * where it leads rather than previewing a quote, so discovery stays a cheap
 * screen and the quote itself keeps its impact where it actually lives.
 */
export function DailyQuotesCard() {
  const router = useRouter();
  const accent = useThemeColor('accent');

  const goToQuotes = () => {
    playSoftPress();
    router.push('/(protected)/quotes');
  };

  return (
    <PressableFeedback
      onPress={goToQuotes}
      accessibilityRole="button"
      accessibilityLabel="Open daily quotes"
    >
      <View
        className="rounded-3xl border border-border/60 bg-surface p-5"
        style={styles.borderCurve}
      >
        <AppText className="h-5 font-serif text-[40px] leading-[26px] text-ember">
          &ldquo;
        </AppText>

        <AppText className="mt-4 text-lg font-semibold text-foreground">
          Daily Quotes
        </AppText>
        <AppText className="mt-1.5 text-sm leading-5 text-muted">
          Curated lines for the day, and the ones your own sessions left behind.
        </AppText>

        <View className="mt-4 flex-row items-center gap-1.5">
          <AppText className="text-[12px] font-semibold" style={{ color: accent as string }}>
            Open quotes
          </AppText>
          <SymbolView name="arrow.right" size={12} tintColor={accent as string} />
        </View>
      </View>
    </PressableFeedback>
  );
}
