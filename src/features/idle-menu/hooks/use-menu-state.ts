import { useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

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

  return {
    isOpen,
    isOpenJS,
    open: () => { isOpen.value = true; setIsOpenJS(true); },
    close: () => { isOpen.value = false; setIsOpenJS(false); },
    toggle: () => {
      const next = !isOpen.value;
      isOpen.value = next;
      setIsOpenJS(next);
    },
  };
}
