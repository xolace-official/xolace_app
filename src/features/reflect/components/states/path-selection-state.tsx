import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/shared/app-text';
import { playPathChoice } from '@/src/lib/haptics';

type Props = {
  mirror: string;
  onSelectSolo: () => Promise<void>;
  onSelectPeers: () => Promise<void>;
  onSelectExit: () => Promise<void>;
};

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL = { opacity: 0, translateY: 20 };
const EASE_ANIMATE = { opacity: 1, translateY: 0 };
const EASE_T1 = { type: 'timing' as const, duration: 400, delay: 200, easing: EASING };
const EASE_T2 = { type: 'timing' as const, duration: 400, delay: 400, easing: EASING };
const EASE_T3 = { type: 'timing' as const, duration: 400, delay: 600, easing: EASING };
const SCROLL_STYLE = { flexGrow: 0, maxHeight: '40%' as const };

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
    } catch (e) {
      if (__DEV__) console.error('[PathSelection] onSelectSolo failed:', e);
      busyRef.current = false;
      return;
    }
    try {
      router.replace('/sit-with-this');
    } catch {
      // non-fatal nav error
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
    } catch (e) {
      if (__DEV__) console.error('[PathSelection] onSelectPeers failed:', e);
      busyRef.current = false;
      return;
    }
    try {
      router.replace('/peer-reflections');
    } catch {
      // non-fatal nav error
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
    } catch (e) {
      if (__DEV__) console.error('[PathSelection] onSelectExit failed:', e);
      busyRef.current = false;
      return;
    }
    try {
      router.replace('/session-end?path=exit');
    } catch {
      // non-fatal nav error
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <View className="flex-1 justify-center px-6">
      <ScrollView
        style={SCROLL_STYLE}
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
        <EaseView
          initialAnimate={EASE_INITIAL}
          animate={EASE_ANIMATE}
          transition={EASE_T1}
        >
          <Pressable onPress={handleSolo}>
            <AppText className="text-lg text-foreground">Sit with this</AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              A quiet space to breathe
            </AppText>
          </Pressable>
        </EaseView>

        <EaseView
          initialAnimate={EASE_INITIAL}
          animate={EASE_ANIMATE}
          transition={EASE_T2}
        >
          <Pressable onPress={handlePeers}>
            <AppText className="text-lg text-foreground">
              You&apos;re not alone
            </AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              See what others have shared
            </AppText>
          </Pressable>
        </EaseView>

        <EaseView
          initialAnimate={EASE_INITIAL}
          animate={EASE_ANIMATE}
          transition={EASE_T3}
        >
          <Pressable onPress={handleExit}>
            <AppText className="text-lg text-foreground">
              I just needed to say it
            </AppText>
            <AppText className="mt-1 text-sm text-foreground/30">
              Return to the beginning
            </AppText>
          </Pressable>
        </EaseView>
      </View>
    </View>
  );
};
