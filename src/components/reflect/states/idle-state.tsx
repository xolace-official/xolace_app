import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';
import { TimelineIcon } from '@/components/reflect/timeline-icon';
import type { UserVariant } from '@/interfaces/reflection';
import * as Haptics from 'expo-haptics';

type Props = {
  variant: UserVariant;
  onTap: () => void;
};

const encouragementText = (variant: UserVariant): string => {
  switch (variant.kind) {
    case 'first-time':
      return "Say whatever's true right now. There's no wrong way to do this.";
    case 'returning':
      return 'Welcome back. Pick up where you left off.';
    case 'active':
      return `Day ${variant.dayCount}`;
  }
};

export const IdleState = ({ variant, onTap }: Props) => {
  const handleTap = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTap();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      className="flex-1 justify-center px-8"
    >
      <View className="items-center gap-6">
        <AppText className="text-center text-sm leading-6 text-foreground/40">
          {encouragementText(variant)}
        </AppText>

        <AppText className="text-start text-3xl font-semibold text-foreground">
          What&apos;s here right now?
        </AppText>

        <Pressable onPress={handleTap} className="mt-8">
          <AppText className="text-center text-base text-accent">
            Tap to begin
          </AppText>
        </Pressable>
      </View>

      <View className="absolute bottom-8 right-8">
        <TimelineIcon />
      </View>
    </Animated.View>
  );
};
