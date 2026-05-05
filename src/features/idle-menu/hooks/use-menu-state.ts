import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

type MenuState = {
  isOpen: SharedValue<boolean>;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export function useMenuState(): MenuState {
  const isOpen = useSharedValue(false);
  return {
    isOpen,
    open: () => { isOpen.value = true; },
    close: () => { isOpen.value = false; },
    toggle: () => { isOpen.value = !isOpen.value; },
  };
}
