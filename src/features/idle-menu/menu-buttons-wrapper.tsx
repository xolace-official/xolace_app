import { View } from "react-native";
import { MenuButtons } from "@/src/features/idle-menu/menu-buttons";

type Props = {
  onClose: () => void;
};

export const MenuButtonsWrapper = ({ onClose }: Props) => (
  <View className="mb-2 min-w-40">
    <MenuButtons onClose={onClose} />
  </View>
);
