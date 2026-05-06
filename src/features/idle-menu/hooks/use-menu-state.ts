import { useEffect, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

// Exit animation completes in ~450ms (150ms max stagger + 300ms opacity timing).
const CLOSE_DEFER_MS = 500;

type MenuState = {
  isOpen: SharedValue<boolean>;
  isOpenJS: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export function useMenuState(): MenuState {
  const isOpen = useSharedValue(false);
  const [isOpenJS, setIsOpenJS] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const deferClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsOpenJS(false), CLOSE_DEFER_MS);
  };

  return {
    isOpen,
    isOpenJS,
    open: () => {
      if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
      isOpen.value = true;
      setIsOpenJS(true);
    },
    close: () => {
      isOpen.value = false;
      deferClose();
    },
    toggle: () => {
      const next = !isOpen.value;
      isOpen.value = next;
      if (next) {
        if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
        setIsOpenJS(true);
      } else {
        deferClose();
      }
    },
  };
}
