import { View } from 'react-native';
import { Button } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';
import { useIntakeComplete } from '@/src/features/intake/use-intake-complete';

/** Placeholder paywall. Both exits — "Not now" and a completed purchase —
 *  run the same terminal step; that is where `onboardingComplete` flips. */
export default function IntakePaywall() {
  const completeIntake = useIntakeComplete();

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <AppText className="text-2xl text-foreground">Paywall</AppText>
      <Button onPress={() => void completeIntake()}>Subscribe</Button>
      <Button variant="ghost" onPress={() => void completeIntake()}>
        Not now
      </Button>
    </View>
  );
}
