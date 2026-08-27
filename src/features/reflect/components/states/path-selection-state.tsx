import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/shared/app-text';
import { PlusOfferCard } from '@/src/features/purchases/components/plus-offer-card';
import { usePlusOffer } from '@/src/features/purchases/use-plus-offer';
import { usePaywall } from '@/src/features/purchases/use-paywall';
import { playPathChoice } from '@/src/lib/haptics';

type Props = {
  mirror: string;
  sessionId: string | null;
  /**
   * The mirror this was affirmed on actually named something. False when it
   * only reached for what the words did not hold, or when the turn cap
   * collapsed the row so "That's it" was the only thing left to press —
   * neither is a landing, and moment 2 is only for a landing.
   */
  mirrorLanded: boolean;
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
  sessionId,
  mirrorLanded,
  onSelectSolo,
  onSelectPeers,
  onSelectExit,
}: Props) => {
  const router = useRouter();
  const busyRef = useRef(false);
  const openPaywall = usePaywall((s) => s.open);
  // Moment 2 (#221 §4). This screen IS the beat — the user has just said the
  // mirror landed. It runs on its own call site rather than waiting for
  // session end, and spends the same one-offer-per-session budget, so a
  // session that offers here offers nothing at its close.
  const [declined, setDeclined] = useState(false);
  const plusOffer = usePlusOffer('mirror_landed', {
    enabled: mirrorLanded,
    sessionId,
  });

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
      // onSelectExit already completed the session, so getActive is now null.
      // Carry the id so session-end can fetch it by id instead of getActive.
      router.replace(
        sessionId
          ? `/session-end?path=exit&sessionId=${sessionId}`
          : '/session-end?path=exit',
      );
    } catch {
      // non-fatal nav error
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <View className="flex-1 justify-center px-6">
      {/* The card stands where the faded recap does rather than above it: the
          path choice below must stay on screen, and stacking a card onto a
          full-height layout is what pushes it off. */}
      {plusOffer && !declined ? (
        <PlusOfferCard
          moment={plusOffer.moment}
          variant={plusOffer.variant}
          observation={plusOffer.observation}
          sessionId={plusOffer.sessionId}
          onOpen={() => openPaywall('mirror_landed')}
          onDismiss={() => setDeclined(true)}
        />
      ) : (
        <ScrollView
          style={SCROLL_STYLE}
          showsVerticalScrollIndicator={false}
        >
          <AppText className="text-base italic leading-7 text-foreground/30">
            {mirror}
          </AppText>
        </ScrollView>
      )}

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
