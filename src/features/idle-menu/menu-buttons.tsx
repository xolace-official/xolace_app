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
  iconName: { ios: SFSymbol; android: string };
  onPress: () => void;
  accessibilityLabel: string;
};

type Props = {
  isOpen: SharedValue<boolean>;
  onClose: () => void;
};

const ICON_DIM_STYLE = { opacity: 0.6 };

export const MenuButtons = ({ isOpen, onClose }: Props) => {
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");
  const containerHeight = useSharedValue(0);

  const items: MenuButtonItem[] = [
    {
      label: "Vent",
      icon: { ios: "mic", android: "mic" },
      iconName: { ios: "mic", android: "mic" },
      accessibilityLabel: "Open voice vent — speak your weight",
      onPress: () => {
        onClose();
        router.push("/(protected)/voice-vent");
      },
    },
    {
      label: "Today",
      icon: { ios: "quote.bubble", android: "format_quote" },
      iconName: { ios: "quote.bubble", android: "format_quote" },
      accessibilityLabel: "Open your daily quote",
      onPress: () => {
        onClose();
        router.push("/(protected)/quotes" as any);
      },
    },
    {
      label: "Timeline",
      icon: { ios: "clock", android: "history" },
      iconName: { ios: "clock", android: "history" },
      accessibilityLabel: "Open your session timeline",
      onPress: () => {
        onClose();
        router.push("/(protected)/timeline");
      },
    },
    {
      label: "Settings",
      icon: { ios: "gearshape", android: "settings" },
      iconName: { ios: "gearshape", android: "settings" },
      accessibilityLabel: "Open settings",
      onPress: () => {
        onClose();
        router.push("/(protected)/settings");
      },
    },
  ];

  const itemIconStyle = ICON_DIM_STYLE;

  const onContainerLayout = (e: {
    nativeEvent: { layout: { height: number } };
  }) => {
    containerHeight.set(e.nativeEvent.layout.height);
  };

  return (
    <View className="gap-1" onLayout={onContainerLayout}>
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
            <View className="flex-row items-center gap-4 rounded-2xl bg-surface px-6 py-4">
              <SymbolView
                name={item.iconName as any}
                size={22}
                tintColor={foregroundColor}
                style={itemIconStyle}
              />
              <AppText className="text-base font-medium text-foreground">
                {item.label}
              </AppText>
            </View>
          </PressableFeedback>
        </AnimatedRow>
      ))}
    </View>
  );
};
