import { Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { MenuTrigger } from "@/src/features/idle-menu/menu-trigger";
import { MenuButtonsWrapper } from "@/src/features/idle-menu/menu-buttons-wrapper";
import { useMenuState } from "@/src/features/idle-menu/hooks/use-menu-state";

export const IdleMenu = () => {
  const { isOpen, isOpenJS, toggle, close } = useMenuState();

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {isOpenJS && (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessible={false}
          />
        </Animated.View>
      )}
      <Animated.View style={styles.menuAnchor} pointerEvents="box-none">
        <MenuButtonsWrapper isOpen={isOpen} isOpenJS={isOpenJS} onClose={close} />
        <MenuTrigger isOpen={isOpen} isOpenJS={isOpenJS} onPress={toggle} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuAnchor: {
    position: "absolute",
    bottom: 88,
    right: 24,
    alignItems: "flex-end",
  },
});
