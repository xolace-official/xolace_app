import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/shared/app-text';
import { playPathChoice } from '@/src/lib/haptics';

type Props = {
  mirror: string;
  onSelectSolo: () => Promise<void>;
  onSelectPeers: () => Promise<void>;
  onSelectExit: () => Promise<void>;
};

export const PathSelectionState = ({
  mirror,
  onSelectSolo,
  onSelectPeers,
  onSelectExit,
}: Props) => {
  const router = useRouter();
  const busyRef = useRef(false);

  const handleSolo = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    playPathChoice();
    try {
      await onSelectSolo();
      router.replace('/sit-with-this');
    } finally {
      busyRef.current = false;
    }
  };

  const handlePeers = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    playPathChoice();
    try {
      await onSelectPeers();
      router.replace('/peer-reflections');
    } finally {
      busyRef.current = false;
    }
  };

  const handleExit = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    playPathChoice();
    try {
      await onSelectExit();
      router.replace('/session-end?path=exit');
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <View className="flex-1 justify-center px-6">
      <ScrollView
        style={{ flexGrow: 0, maxHeight: '40%' }}
        showsVerticalScrollIndicator={false}
      >
        <AppText className="text-base italic leading-7 text-foreground/30">
          {mirror}
        </AppText>
      </ScrollView>

      <AppText className="mb-2 mt-10 text-lg text-foreground">
        Where would you like to go from here?
      </AppText>
      <AppText className="mb-6 text-sm text-foreground/20">
        Take a moment; once you choose, you&apos;ll continue there.
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
          <Pressable onPress={handleExit}>
            <AppText className="text-lg text-foreground">
              I just needed to say it
            </AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              Return to the beginning
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};
