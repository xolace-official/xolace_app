import { View } from "react-native";
import { useRouter } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import { playSoftPress } from "@/src/lib/haptics";

export default function VoiceVentScreen() {
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");

  const handleClose = () => {
    playSoftPress();
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      {/* Close button */}
      <View className="absolute right-6 top-14 z-10">
        <PressableFeedback
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close and return"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface">
            <SymbolView
              name={{ ios: "xmark", android: "close" }}
              size={16}
              tintColor={foregroundColor}
              style={{ opacity: 0.6 }}
            />
          </View>
        </PressableFeedback>
      </View>

      {/* Placeholder content */}
      <View className="flex-1 items-center justify-center px-8">
        <AppText className="text-center text-lg font-semibold text-foreground/40">
          Voice Vent
        </AppText>
        <AppText className="mt-2 text-center text-sm text-foreground/25">
          Coming soon — speak your weight into the void.
        </AppText>
      </View>
    </View>
  );
}
