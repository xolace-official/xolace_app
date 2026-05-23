import { Pressable, StyleSheet, View } from "react-native";
import { useMemo } from "react";
import { EaseView } from "react-native-ease/uniwind";
import { BlurView } from "expo-blur";
import { MenuTrigger } from "@/src/features/idle-menu/menu-trigger";
import { MenuButtonsWrapper } from "@/src/features/idle-menu/menu-buttons-wrapper";
import { useMenuState } from "@/src/features/idle-menu/hooks/use-menu-state";

const EASE_INITIAL = { opacity: 0 };
const EASE_ANIMATE = { opacity: 1 };
const EASE_TRANSITION = {
  type: "timing" as const,
  duration: 150,
  easing: [0.455, 0.03, 0.515, 0.955] as [number, number, number, number],
};

export const IdleMenu = () => {
  const { isOpen, isOpenJS, toggle, close } = useMenuState();
  const absoluteFillStyle = useMemo(() => StyleSheet.absoluteFill, []);

  return (
    <View style={absoluteFillStyle} pointerEvents="box-none">
      {isOpenJS && (
        <EaseView
          initialAnimate={EASE_INITIAL}
          animate={EASE_ANIMATE}
          transition={EASE_TRANSITION}
          style={absoluteFillStyle}
          pointerEvents="auto"
        >
          <BlurView intensity={20} tint="dark" style={absoluteFillStyle} />
          <Pressable
            style={absoluteFillStyle}
            onPress={close}
            accessible={false}
          />
        </EaseView>
      )}
      <View style={styles.menuAnchor} pointerEvents="box-none">
        <MenuButtonsWrapper
          isOpen={isOpen}
          isOpenJS={isOpenJS}
          onClose={close}
        />
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
