import { ScrollView } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';

/** Sample second tab — placeholder only. */
export function CheckInScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="p-5 gap-3"
    >
      <AppText className="text-2xl font-semibold text-foreground">
        Check-in
      </AppText>
      <AppText className="text-sm text-foreground/60">Placeholder tab.</AppText>
    </ScrollView>
  );
}
