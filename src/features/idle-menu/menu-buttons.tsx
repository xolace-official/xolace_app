import { View } from "react-native";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { useRouter } from "expo-router";
import { SymbolView, SFSymbol } from "expo-symbols";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { AppText } from "@/src/components/shared/app-text";
import { AnimatedRow } from "@/src/features/idle-menu/animated-row";
import { playSoftPress } from "@/src/lib/haptics";

type MenuButtonItem = {
  label: string;
  icon: { ios: SFSymbol; android: string };
  onPress: () => void;
  accessibilityLabel: string;
};

type Props = {
  isOpen: SharedValue<boolean>;
  onClose: () => void;
};

export const MenuButtons = ({ isOpen, onClose }: Props) => {
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");
  const containerHeight = useSharedValue(0);

  const items: MenuButtonItem[] = [
    {
      label: "Vent",
      icon: { ios: "mic", android: "mic" },
      accessibilityLabel: "Open voice vent — speak your weight",
      onPress: () => {
        onClose();
        router.push("/(protected)/voice-vent");
      },
    },
    {
      label: "Timeline",
      icon: { ios: "clock", android: "history" },
      accessibilityLabel: "Open your session timeline",
      onPress: () => {
        onClose();
        router.push("/(protected)/timeline");
      },
    },
    {
      label: "Settings",
      icon: { ios: "gearshape", android: "settings" },
      accessibilityLabel: "Open settings",
      onPress: () => {
        onClose();
        router.push("/(protected)/settings");
      },
    },
  ];

  return (
    <View
      className="gap-1"
      onLayout={(e) => {
        containerHeight.value = e.nativeEvent.layout.height;
      }}
    >
      {items.map((item, index) => (
        <AnimatedRow
          key={item.label}
          isOpen={isOpen}
          index={index}
          numberOfRows={items.length}
          containerHeight={containerHeight}
        >
          <PressableFeedback
            onPress={() => {
              playSoftPress();
              item.onPress();
            }}
            accessibilityRole="menuitem"
            accessibilityLabel={item.accessibilityLabel}
          >
            <View className="flex-row items-center gap-3 rounded-xl bg-surface px-4 py-3">
              <SymbolView
                name={{ ios: item.icon.ios, android: item.icon.android as any }}
                size={16}
                tintColor={foregroundColor}
                style={{ opacity: 0.6 }}
              />
              <AppText className="text-sm font-medium text-foreground">
                {item.label}
              </AppText>
            </View>
          </PressableFeedback>
        </AnimatedRow>
      ))}
    </View>
  );
};
