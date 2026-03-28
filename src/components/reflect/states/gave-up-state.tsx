import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinkButton } from 'heroui-native';
import { AppText } from '@/components/shared/app-text';

type Props = {
  onPathSelection: () => void;
  onReset: () => void;
};

export const GaveUpState = ({ onPathSelection, onReset }: Props) => (
  <View className="flex-1 justify-center px-6">
    <AppText className="text-xl leading-8 text-foreground">
      Sometimes words can&apos;t quite capture what we feel — and that&apos;s okay.
    </AppText>

    <AppText className="mt-4 text-base leading-6 text-foreground/40">
      What you shared still matters, even if the mirror didn&apos;t reflect it perfectly.
    </AppText>

    <View className="mt-14 gap-6">
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <LinkButton accessibilityLabel="See my options" onPress={onPathSelection} size="md" className="self-start">
          <LinkButton.Label className="font-semibold text-accent">
            See my options
          </LinkButton.Label>
        </LinkButton>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <LinkButton accessibilityLabel="Start fresh" onPress={onReset} size="md" className="self-start">
          <LinkButton.Label className="text-foreground/50">
            Start fresh
          </LinkButton.Label>
        </LinkButton>
      </Animated.View>
    </View>
  </View>
);
