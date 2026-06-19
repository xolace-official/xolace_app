/**
 * Orchestrator: renders the always-visible mini card in the header
 * and, when the streak has increased past the last acknowledged day,
 * measures the mini card and mounts the reveal overlay via Portal.
 */
import { useEffect, useState } from "react";

import { useIsFocused } from "expo-router/react-navigation";
import { Portal, useThemeColor } from "heroui-native";
import Animated, {
  measure,
  runOnUI,
  useAnimatedRef,
  useReducedMotion,
  type MeasuredDimensions,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useAppStore } from "@/src/store/store";
import { posthog } from "@/src/config/posthog";
import {
  getCardMetrics,
  MINI_SIZE,
  REVEAL_START_DELAY_MS,
  type CardColors,
} from "./constants";
import { RevealOverlay } from "./reveal-overlay";
import { StreakFlipCard } from "./streak-flip-card";

const MINI_METRICS = getCardMetrics(MINI_SIZE);
const miniCardStyle = { width: MINI_SIZE };

type Props = {
  currentStreak: number;
};

export const StreakCalendar = ({ currentStreak }: Props) => {
  const lastAcknowledgedStreak = useAppStore((s) => s.lastAcknowledgedStreak);
  const setLastAcknowledgedStreak = useAppStore(
    (s) => s.setLastAcknowledgedStreak,
  );
  const reducedMotion = useReducedMotion();
  // The reflect screen stays mounted under pushed screens, and the
  // reveal renders via Portal above everything — so without this gate
  // a streak update would play the reveal on top of whatever screen
  // the user is on. Wait until this screen is focused again.
  const isFocused = useIsFocused();

  const headerColor = useThemeColor("accent") as string;
  const headerTextColor = useThemeColor("accent-foreground") as string;
  const bodyColor = useThemeColor("surface") as string;
  const numberColor = useThemeColor("foreground") as string;

  const colors: CardColors = {
    header: headerColor,
    headerText: headerTextColor,
    body: bodyColor,
    number: numberColor,
  };

  const miniRef = useAnimatedRef<Animated.View>();
  const [miniLayout, setMiniLayout] = useState<MeasuredDimensions | null>(null);

  const revealPending =
    currentStreak > lastAcknowledgedStreak && currentStreak > 0;
  const revealing = miniLayout !== null;

  useEffect(() => {
    // Streak reset (or first sync after install) — acknowledge silently
    if (currentStreak < lastAcknowledgedStreak) {
      setLastAcknowledgedStreak(currentStreak);
      return;
    }
    if (!revealPending || revealing || !isFocused) return;

    // Reduced motion: skip the reveal entirely, just update the number
    if (reducedMotion) {
      setLastAcknowledgedStreak(currentStreak);
      return;
    }

    const timer = setTimeout(() => {
      runOnUI(() => {
        "worklet";
        const layout = measure(miniRef);
        if (layout !== null) scheduleOnRN(setMiniLayout, layout);
      })();
    }, REVEAL_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [
    currentStreak,
    lastAcknowledgedStreak,
    revealPending,
    revealing,
    reducedMotion,
    isFocused,
    miniRef,
    setLastAcknowledgedStreak,
  ]);

  const handleDismissed = () => {
    setLastAcknowledgedStreak(currentStreak);
    setMiniLayout(null);
    posthog.capture("streak_reveal_acknowledged", { day: currentStreak });
  };

  // While a reveal is pending/running, the mini shows the old number
  const miniDay = revealPending ? Math.max(currentStreak - 1, 0) : currentStreak;

  return (
    <>
      <Animated.View
        ref={miniRef}
        className={revealing ? "opacity-0" : "opacity-100"}
        style={miniCardStyle}
      >
        <StreakFlipCard day={miniDay} metrics={MINI_METRICS} colors={colors} />
      </Animated.View>

      {revealing && (
        <Portal name="streak-reveal">
          <RevealOverlay
            day={currentStreak}
            miniLayout={miniLayout}
            colors={colors}
            onDismissed={handleDismissed}
          />
        </Portal>
      )}
    </>
  );
};
