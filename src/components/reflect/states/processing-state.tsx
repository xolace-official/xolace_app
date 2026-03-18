import { View } from 'react-native';
import { AppText } from '@/components/shared/app-text';
import { BreathingOrb } from '@/components/reflect/breathing-orb';

export const ProcessingState = () => (
  <View className="flex-1 items-center justify-center gap-8">
    <BreathingOrb />
    <AppText className="text-sm text-foreground/40 mt-2">
      Listening...
    </AppText>
  </View>
);
