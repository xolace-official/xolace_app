import { Platform } from "react-native";
import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { createShakeDetector } from "./shake-detector";

/**
 * Explicit, because the platform defaults disagree — Android gates at 100ms
 * while iOS leaves CoreMotion at its ~100Hz default. 50ms is fast enough to
 * catch every half-cycle of a 4Hz shake and cheap enough to leave running.
 */
const SAMPLE_INTERVAL_MS = 50;

type Options = {
  /** Pure-derived per call-site. When false, no accelerometer subscription. */
  enabled: boolean;
  /** Fired on a qualifying shake. */
  onShake: () => void;
};

/**
 * Subscribes to the accelerometer only while `enabled`, and tears the
 * subscription down when disabled or on unmount (covers navigating away from a
 * screen-scoped call site). Shake qualification lives in `createShakeDetector`
 * — see its tests for the motion it does and does not accept. The dev-menu
 * fallback is registered once globally (see useDevMenuTrigger), not here, to
 * avoid duplicate menu items.
 */
export const useShakeToOpen = ({ enabled, onShake }: Options) => {
  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled || Platform.OS === "web") return;

    let cancelled = false;
    const detect = createShakeDetector();
    let subscription: ReturnType<typeof Accelerometer.addListener> | null =
      null;

    Accelerometer.isAvailableAsync().then((available) => {
      if (!available || cancelled) return;
      Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
      subscription = Accelerometer.addListener((sample) => {
        if (detect(sample, Date.now())) onShakeRef.current();
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
};
