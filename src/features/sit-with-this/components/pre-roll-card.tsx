import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { View } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/reflect/pill-button';

type Props = {
  onBegin: () => void;
};

export function PreRollCard({ onBegin }: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      exiting={FadeOut.duration(300)}
      className="flex-1 items-center justify-center px-8"
    >
      <View className="items-center gap-6">
        <AppText className="text-center text-2xl font-semibold text-foreground">
          Sit with this
        </AppText>
        <AppText className="text-center text-base text-foreground/50">
          This takes about 90 seconds.{'\n'}Stay with it.
        </AppText>
        <Animated.View entering={FadeIn.delay(600).duration(400)}>
          <PillButton label="Begin" onPress={onBegin} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}
