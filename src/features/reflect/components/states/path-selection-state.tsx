import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { usePlusOffer } from '@/src/features/purchases/use-plus-offer';
import { usePaywall } from '@/src/features/purchases/use-paywall';
import { playPathChoice } from '@/src/lib/haptics';
import { useSessionEndHref } from '@/src/features/kindling/use-session-end-href';
import { PathChoiceCard } from '@/src/features/reflect/components/states/path-choice-card';
import { PathOfferLayer } from '@/src/features/reflect/components/states/path-offer-layer';
import { cn } from '@/src/lib/utils';

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
/** Flux steps back while the offer layer takes the top of the stack. */
const FLUX_MAP_SMALL = { width: 72, height: 101 };
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

  const offering = plusOffer !== null && !declined;

  return (
    <View className="flex-1">
      {/* Flux asks; the question floats up-right of his head with a tail back
          to him, so it reads as him speaking, not a card beside him. */}
      <View className={cn('flex-1 flex-row items-end px-5 pt-2', offering ? 'pb-12' : 'pb-16')}>
        <Image
          source={FLUX_MAP}
          contentFit="contain"
          style={offering ? FLUX_MAP_SMALL : FLUX_MAP_STYLE}
          accessibilityLabel="Flux, holding a map"
        />
        <View className={cn('ml-1 flex-1', offering ? 'mb-20' : 'mb-32')}>
          <View className={cn('rounded-3xl bg-surface shadow-sm', offering ? 'px-4 py-3' : 'px-5 py-4')}>
            <AppText
              className={cn('font-medium text-foreground', offering ? 'text-lg' : 'text-2xl leading-8')}
            >
              Where to from here?
            </AppText>
            <AppText className="mt-1 text-sm text-foreground/50">Pick whichever feels right.</AppText>
          </View>
          <View className="absolute -bottom-1.5 left-3 h-4 w-4 rotate-45 rounded-sm bg-surface" />
        </View>
      </View>

      {/* The offer is the stack's top layer, not a replacement for the
          question: the three paths stay on screen and one tap away. */}
      {offering ? (
        <PathOfferLayer
          moment={plusOffer.moment}
          variant={plusOffer.variant}
          sessionId={plusOffer.sessionId}
          onOpen={() => openPaywall('mirror_landed')}
          onDismiss={() => setDeclined(true)}
        />
      ) : null}

      {PATHS.map((p, i) => (
        <PathChoiceCard
          key={p.key}
          index={offering ? i + 1 : i}
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
