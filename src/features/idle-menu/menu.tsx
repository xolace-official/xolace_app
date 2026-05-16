import { Pressable, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { BlurView } from "expo-blur";
import { MenuTrigger } from "@/src/features/idle-menu/menu-trigger";
import { MenuButtonsWrapper } from "@/src/features/idle-menu/menu-buttons-wrapper";
import { useMenuState } from "@/src/features/idle-menu/hooks/use-menu-state";

export const IdleMenu = () => {
  const { isOpen, isOpenJS, toggle, close } = useMenuState();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {isOpenJS && (
        <EaseView
          initialAnimate={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 150, easing: [0.455, 0.03, 0.515, 0.955] }}
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessible={false}
          />
        </EaseView>
      )}
      <View style={styles.menuAnchor} pointerEvents="box-none">
        <MenuButtonsWrapper isOpen={isOpen} isOpenJS={isOpenJS} onClose={close} />
        <MenuTrigger isOpen={isOpen} isOpenJS={isOpenJS} onPress={toggle} />
      </View>
    </View>
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
