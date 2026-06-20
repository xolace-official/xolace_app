import { Platform } from "react-native";
import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { leadingDebounce } from "../engine/debounce";

const SHAKE_THRESHOLD = 250;
const SAMPLE_INTERVAL_MS = 100;
const DEBOUNCE_MS = 500;

type Options = {
  /** Pure-derived per call-site. When false, no accelerometer subscription. */
  enabled: boolean;
  /** Fired (leading-debounced) on a qualifying shake or the dev menu item. */
  onShake: () => void;
};

/**
 * Subscribes to the accelerometer only while `enabled`, and tears the
 * subscription down when disabled or on unmount (covers navigating away from a
 * screen-scoped call site). A 500ms leading debounce absorbs rapid repeat
 * shakes. The dev-menu fallback is registered once globally (see
 * useDevMenuTrigger), not here, to avoid duplicate menu items.
 */
export const useShakeToOpen = ({ enabled, onShake }: Options) => {
  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled || Platform.OS === "web") return;

    let cancelled = false;
    let lastUpdate = 0;
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    const fire = leadingDebounce(() => onShakeRef.current(), DEBOUNCE_MS);
    let subscription: ReturnType<typeof Accelerometer.addListener> | null =
      null;

    Accelerometer.isAvailableAsync().then((available) => {
      if (!available || cancelled) return;
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const now = Date.now();
        if (now - lastUpdate <= SAMPLE_INTERVAL_MS) return;
        const diff = now - lastUpdate;
        lastUpdate = now;
        const speed =
          ((Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ)) /
            diff) *
          10000;
        if (speed > SHAKE_THRESHOLD) fire();
        lastX = x;
        lastY = y;
        lastZ = z;
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
};
