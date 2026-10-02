import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { PlusOfferCard } from '@/src/features/purchases/components/plus-offer-card';
import { usePlusOffer } from '@/src/features/purchases/use-plus-offer';
import { usePaywall } from '@/src/features/purchases/use-paywall';
import { playPathChoice } from '@/src/lib/haptics';
import { useSessionEndHref } from '@/src/features/kindling/use-session-end-href';
import { PathChoiceCard } from '@/src/features/reflect/components/states/path-choice-card';

type Props = {
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

const FLUX_MAP = require('@/assets/images/flux/flux-map.png');
const FLUX_MAP_STYLE = { width: 132, height: 186 };
const LAST_TINT = 'bg-accent/15';

const PATHS = [
  {
    key: 'solo',
    title: 'Sit with this',
    sub: 'A quiet space to breathe',
    image: require('@/assets/images/flux/flux-campfire.png'),
    tint: 'bg-ember/25',
  },
  {
    key: 'peers',
    title: "You're not alone",
    sub: 'See what others have shared',
    image: require('@/assets/images/flux/flux-pair-listening.png'),
    tint: 'bg-frost/20',
  },
  {
    key: 'exit',
    title: 'I just needed to say it',
    sub: 'Return to the beginning',
    image: require('@/assets/images/flux/flux-whisper.png'),
    tint: LAST_TINT,
  },
] as const;

export const PathSelectionState = ({
  sessionId,
  mirrorLanded,
  onSelectSolo,
  onSelectPeers,
  onSelectExit,
}: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const busyRef = useRef(false);
  const openPaywall = usePaywall((s) => s.open);
  const afterPath = useSessionEndHref(sessionId);
  // Moment 2 (#221 §4). This screen IS the beat — the user has just said the
  // mirror landed. It runs on its own call site rather than waiting for
  // session end, and spends the same one-offer-per-session budget, so a
  // session that offers here offers nothing at its close.
  const [declined, setDeclined] = useState(false);
  const plusOffer = usePlusOffer('mirror_landed', {
    enabled: mirrorLanded,
    sessionId,
  });

  // `href` is read by the caller before `select` runs: exit's must be, since
  // completing the session nulls getActive (see useSessionEndHref).
  const choose = async (select: () => Promise<void>, href: Href) => {
    if (busyRef.current) return;
    busyRef.current = true;
    playPathChoice();
    try {
      await select();
    } catch (e) {
      if (__DEV__) console.error('[PathSelection] select failed:', e);
      busyRef.current = false;
      return;
    }
    try {
      router.replace(href);
    } catch {
      // non-fatal nav error
    } finally {
      busyRef.current = false;
    }
  };

  const select = {
    solo: () => choose(onSelectSolo, '/sit-with-this'),
    peers: () => choose(onSelectPeers, '/peer-reflections'),
    // Exit has no activity, so the kindling announcement (when due) sits
    // right after the path choice.
    exit: () => choose(onSelectExit, afterPath('exit')),
  };

  return (
    <View className="flex-1">
      {/* The offer stands where Flux and the question do rather than above
          them: the stack below must stay on screen. */}
      {plusOffer && !declined ? (
        <View className="flex-1 justify-center px-6 pb-16">
          <PlusOfferCard
            moment={plusOffer.moment}
            variant={plusOffer.variant}
            observation={plusOffer.observation}
            sessionId={plusOffer.sessionId}
            onOpen={() => openPaywall('mirror_landed')}
            onDismiss={() => setDeclined(true)}
          />
        </View>
      ) : (
        <View className="flex-1 flex-row items-end gap-2 px-5 pb-16 pt-6">
          <Image
            source={FLUX_MAP}
            contentFit="contain"
            style={FLUX_MAP_STYLE}
            accessibilityLabel="Flux, holding a map"
          />
          <View className="mb-24 flex-1 rounded-3xl rounded-bl-md bg-surface px-5 py-4 shadow-sm">
            <AppText className="font-medium text-2xl leading-8 text-foreground">
              Where to from here?
            </AppText>
            <AppText className="mt-1 text-sm text-foreground/50">
              Pick whichever feels right.
            </AppText>
          </View>
        </View>
      )}

      {PATHS.map((p, i) => (
        <PathChoiceCard
          key={p.key}
          index={i}
          last={i === PATHS.length - 1}
          title={p.title}
          sub={p.sub}
          image={p.image}
          tint={p.tint}
          onPress={() => void select[p.key]()}
        />
      ))}
      <View className="bg-surface">
        <View className={LAST_TINT} style={{ height: insets.bottom + 40 }} />
      </View>
    </View>
  );
};
