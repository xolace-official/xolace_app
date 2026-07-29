import { StyleSheet, View } from 'react-native';
import { Switch, useThemeColor, useToast } from 'heroui-native';
import { SymbolView } from 'expo-symbols';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });

const ICON = {
  active: { ios: 'dot.radiowaves.left.and.right', android: 'sensors', web: 'sensors' },
  paused: { ios: 'moon.zzz.fill', android: 'bedtime', web: 'bedtime' },
} as const;

/**
 * A published xolacer's only always-visible control: step off the roster
 * without deleting anything. Lives at the top of Connect because that's the
 * one screen a xolacer is already on — a settings row would hide the thing
 * someone reaches for precisely when they're too drained to go looking.
 */
export function XolacerStatusCard({ active }: { active: boolean }) {
  const setActive = useMutation(api.xolacerChat.setXolacerActive);
  const { toast } = useToast();
  const accent = useThemeColor('accent') as string;
  const muted = useThemeColor('muted') as string;

  return (
    <View
      className="flex-row items-center gap-3 rounded-3xl border border-border/40 bg-surface p-4"
      style={styles.borderCurve}
    >
      <SymbolView
        name={active ? ICON.active : ICON.paused}
        size={18}
        tintColor={active ? accent : muted}
      />
      <View className="flex-1">
        <AppText className="text-sm font-semibold text-foreground">
          {active ? "You're listed" : "You're paused"}
        </AppText>
        <AppText className="mt-0.5 text-xs leading-4 text-muted">
          {active
            ? 'People can find you and send requests.'
            : "You're off the roster. Chats you already have still work."}
        </AppText>
      </View>
      <Switch
        isSelected={active}
        onSelectedChange={(next) => {
          playSoftPress();
          setActive({ active: next }).catch((err) => {
            console.error('[xolacer-chat] setXolacerActive failed', err);
            toast.show({
              label: next ? "Couldn't list you" : "Couldn't pause you",
              description: 'Something went wrong. Try again.',
              variant: 'default',
            });
          });
        }}
        accessibilityLabel="Available for new conversations"
      >
        <Switch.Thumb />
      </Switch>
    </View>
  );
}
