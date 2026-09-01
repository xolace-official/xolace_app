import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';

/** Placeholder founder message — the entry point of intake, and where a cold
 *  kill mid-intake relaunches (no step cursor is kept). */
export default function IntakeIndex() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <AppText className="text-2xl text-foreground">Founder message</AppText>
      <Button onPress={() => router.push('/(intake)/questionnaire')}>
        Next
      </Button>
    </View>
  );
}
