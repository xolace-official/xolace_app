import { View } from "react-native";
import { GlassView } from "expo-glass-effect";
import { PressableFeedback } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  iosIcon: string;
  androidIcon: string;
  label: string;
  foregroundColor: string;
  onPress: () => void;
};

export function QuickAction({ iosIcon, androidIcon, label, foregroundColor, onPress }: Props) {
  return (
    <PressableFeedback onPress={onPress} accessibilityLabel={label} hitSlop={8}>
      <View className="items-center gap-2">
        <GlassView
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${foregroundColor}08`,
          }}
          glassEffectStyle="clear"
        >
          <SymbolView
            name={{ ios: iosIcon as any, android: androidIcon as any }}
            size={22}
            tintColor={`${foregroundColor}70`}
          />
        </GlassView>
        <AppText className="text-xs" style={{ color: `${foregroundColor}50` }}>
          {label}
        </AppText>
      </View>
    </PressableFeedback>
  );
}
