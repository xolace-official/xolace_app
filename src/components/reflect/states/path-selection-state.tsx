import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/shared/app-text';

type Props = {
  mirror: string;
  onSelectSolo: () => Promise<void>;
  onSelectPeers: () => Promise<void>;
  onExitComplete: () => void;
};

export const PathSelectionState = ({
  mirror,
  onSelectSolo,
  onSelectPeers,
  onExitComplete,
}: Props) => {
  const router = useRouter();
  const busyRef = useRef(false);

  const handleSolo = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await onSelectSolo();
      router.push('/sit-with-this');
    } finally {
      busyRef.current = false;
    }
  };

  const handlePeers = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await onSelectPeers();
      router.push('/peer-reflections');
    } finally {
      busyRef.current = false;
    }
  };

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
          <Pressable onPress={handleSolo}>
            <AppText className="text-lg text-foreground">Sit with this</AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              A quiet space to breathe
            </AppText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Pressable onPress={handlePeers}>
            <AppText className="text-lg text-foreground">
              You&apos;re not alone
            </AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              See what others have shared
            </AppText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Pressable onPress={onExitComplete}>
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
