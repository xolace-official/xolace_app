import { View } from "react-native";
import { MenuTrigger } from "@/src/features/idle-menu/menu-trigger";
import { MenuButtonsWrapper } from "@/src/features/idle-menu/menu-buttons-wrapper";
import { useMenuState } from "@/src/features/idle-menu/hooks/use-menu-state";

export const IdleMenu = () => {
  const { isOpen, open, close } = useMenuState();

  return (
    <View className="items-end">
      {isOpen && <MenuButtonsWrapper onClose={close} />}
      <MenuTrigger onPress={isOpen ? close : open} />
    </View>
  );
};
