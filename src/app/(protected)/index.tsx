import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReflectScreen } from '@/src/features/reflect/components/reflect-screen';
import { AppText } from '@/src/components/shared/app-text';
import { useAppStore } from '@/src/store/store';
import { FounderWelcomeSheet } from '@/src/features/founder-welcome/components/founder-welcome-sheet';

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

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const animate = { opacity: visible ? 1 : 0 };
  const transition = visible
    ? { type: 'timing' as const, duration: 400, easing: [0.455, 0.03, 0.515, 0.955] as [number, number, number, number] }
    : { type: 'timing' as const, duration: 300, easing: [0.455, 0.03, 0.515, 0.955] as [number, number, number, number] };
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
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
    <View className="flex-1">
      <ReflectScreen />
      {lastNotification && (
        <NotificationBanner
          content={lastNotification.content}
          onDismiss={clearLastNotification}
        />
      )}
      <FounderWelcomeSheet isOpen={showWelcome} onDismiss={handleWelcomeDismiss} />
    </View>
  );
}
