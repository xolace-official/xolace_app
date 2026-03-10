import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/shared/app-text';

type Props = {
  mirror: string;
  onReset: () => void;
};

export const PathSelectionState = ({ mirror, onReset }: Props) => {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      exiting={FadeOut.duration(500)}
      className="flex-1 justify-center px-6"
    >
      <ScrollView
        style={{ flexGrow: 0, maxHeight: '40%' }}
        showsVerticalScrollIndicator={false}
      >
        <AppText className="text-base italic leading-7 text-foreground/30">
          {mirror}
        </AppText>
      </ScrollView>

      <AppText className="mb-8 mt-10 text-lg text-foreground">
        Where would you like to go from here?
      </AppText>

      <View className="gap-8">
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Pressable onPress={() => router.push('/sit-with-this' )}>
            <AppText className="text-lg text-foreground">Sit with this</AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              A quiet space to breathe
            </AppText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Pressable onPress={() => router.push('/community' )}>
            <AppText className="text-lg text-foreground">
              You&apos;re not alone
            </AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              See what others have shared
            </AppText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Pressable onPress={onReset}>
            <AppText className="text-lg text-foreground">
              I just needed to say it
            </AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              Return to the beginning
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
};
