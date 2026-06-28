import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from "expo-router/react-navigation";
import { StatusBar } from 'expo-status-bar';
import { useObserve } from 'expo-observe';

import { useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { ReflectScreen } from '@/src/features/reflect/components/reflect-screen';
import { AppText } from '@/src/components/shared/app-text';
import { useAppStore } from '@/src/store/store';
import { FounderWelcomeSheet } from '@/src/features/founder-welcome/components/founder-welcome-sheet';
import { MonthlyEventSheet } from '@/src/features/awareness-events/components/monthly-event-sheet';
import { useAwarenessEvent } from '@/src/features/awareness-events/hooks/use-awareness-event';
import { ReturnWelcomeSheet } from '@/src/features/reflect/components/return-welcome-sheet';
import { useReturnWelcome } from '@/src/features/reflect/hooks/use-return-welcome';
import { FollowUpCheckInSheet } from '@/src/features/reflect/components/follow-up-check-in-sheet';
import { useFollowUpCheckIn } from '@/src/features/reflect/hooks/use-follow-up-check-in';
import {
  computeUserVariant,
  computeQuietReturn,
} from '@/src/helpers/utils/user-variant';

const BANNER_INITIAL = { opacity: 0 };

function NotificationBanner({ content, onDismiss }: { content: string; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
  };

  useEffect(() => {
    const timer = setTimeout(handleDismiss, 8_000);
    return () => clearTimeout(timer);
  }, []);

  const animate = { opacity: visible ? 1 : 0 };
  const transition = visible
    ? { type: 'timing' as const, duration: 400, easing: [0.455, 0.03, 0.515, 0.955] as [number, number, number, number] }
    : { type: 'timing' as const, duration: 300, easing: [0.455, 0.03, 0.515, 0.955] as [number, number, number, number] };
  const bannerStyle = {
    position: 'absolute' as const,
    top: insets.top + 8,
    left: 20,
    right: 20,
    zIndex: 10,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)',
  };

  return (
    <EaseView
      initialAnimate={BANNER_INITIAL}
      animate={animate}
      transition={transition}
      onTransitionEnd={({ finished }) => {
        if (finished && !visible) onDismiss();
      }}
      style={bannerStyle}
      className={"rounded-2xl"}
    >
      <Pressable
        onPress={handleDismiss}
        className="bg-surface border border-border/40 rounded-2xl px-4 py-3"
      >
        <AppText className="text-[11px] uppercase tracking-wide text-foreground/40 mb-0.5">
          You were reached
        </AppText>
        <AppText className="text-sm text-foreground/85 leading-5">
          {content}
        </AppText>
        <AppText className="text-[10px] text-foreground/30 mt-1.5">
          tap to dismiss
        </AppText>
      </Pressable>
    </EaseView>
  );
}

export default function ProtectedIndex() {
  const lastNotification = useAppStore((s) => s.lastNotification);
  const clearLastNotification = useAppStore((s) => s.clearLastNotification);
  const founderWelcomeSeen = useAppStore((s) => s.founderWelcomeSeen);
  const setFounderWelcomeSeen = useAppStore((s) => s.setFounderWelcomeSeen);
  const [showWelcome, setShowWelcome] = useState(false);
  const isFocused = useIsFocused();
  const awarenessEvent = useAwarenessEvent();
  const { markInteractive } = useObserve();

  // Same getFullContext query ReflectScreen subscribes to — Convex dedupes it,
  // so this is a cached read, not a second round-trip.
  const fullContext = useQuery(api.users.getFullContext);
  const profile = fullContext?.profile;
  const hasPendingFollowUp = fullContext?.hasPendingFollowUp ?? false;
  console.log("hasPendingFollowUp", hasPendingFollowUp)

  // Follow-up check-in surfaces on reopen when a session left something
  // unresolved. It OUT-PRIORITIZES ReturnWelcomeSheet (reopen precedence): when
  // a follow-up is pending/ready we suppress the return-welcome for this reopen.
  const followUp = useFollowUpCheckIn({
    active: founderWelcomeSeen && !showWelcome && isFocused && !!profile,
    hasPendingFollowUp,
  });

  // Per-route TTI for the reflect home: the screen is genuinely ready once the
  // user context query resolves, not at mount. markInteractive emits telemetry
  // (a side effect), so it must run in an effect — only the first call per
  // navigation is recorded, so the gate effectively fires it once.
  useEffect(() => {
    if (profile) markInteractive();
  }, [profile, markInteractive]);

  // The lapsed-user greeting sits ahead of the awareness event in the home
  // sheet chain: FounderWelcome → ReturnWelcome → MonthlyEvent. It only arms
  // once founder welcome is resolved and the screen is focused.
  const returnWelcome = useReturnWelcome({
    active: founderWelcomeSeen && !showWelcome && isFocused && !!profile && !followUp.blocking,
    variant: profile ? computeUserVariant(profile) : { kind: 'first-time' },
    quietReturn: profile ? computeQuietReturn(profile) : null,
    lastSessionAt: profile?.lastSessionAt,
  });

  useEffect(() => {
    if (founderWelcomeSeen) return;
    const t = setTimeout(() => setShowWelcome(true), 400);
    return () => clearTimeout(t);
  }, [founderWelcomeSeen]);

  const handleWelcomeDismiss = () => {
    setFounderWelcomeSeen(true);
    setShowWelcome(false);
  };

  return (
    <>
 <StatusBar hidden />      
    <View className="flex-1">
      <ReflectScreen />
      {lastNotification && (
        <NotificationBanner
          content={lastNotification.content}
          onDismiss={clearLastNotification}
        />
      )}
      <FounderWelcomeSheet isOpen={showWelcome} onDismiss={handleWelcomeDismiss} />
      <ReturnWelcomeSheet
        isOpen={returnWelcome.isOpen}
        tier={returnWelcome.tier}
        onClose={returnWelcome.dismiss}
      />
      <FollowUpCheckInSheet
        card={followUp.card}
        isOpen={followUp.isOpen}
        onResolve={followUp.resolve}
        onDismiss={followUp.dismiss}
      />
      <MonthlyEventSheet
        event={
          founderWelcomeSeen && isFocused && !returnWelcome.blocking && !followUp.blocking
            ? awarenessEvent
            : null
        }
      />
    </View>
    </>
  );
}
