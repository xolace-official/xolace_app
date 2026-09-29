import { Pressable, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton, PressableFeedback, useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { useEffectiveReducedMotion } from "@/src/lib/motion/use-effective-reduced-motion";
import { playSoftPress } from "@/src/lib/haptics";
import {
  STARTER_ROWS,
  type StarterRow,
} from "@/src/features/starter-suggestions/starter-rows";

const FLUX = require("@/assets/images/flux/flux-map.png");
const FLUX_STYLE = { width: 84, height: 112, marginTop: -8, marginLeft: 8 };
const EASING = [0.23, 1, 0.32, 1] as [number, number, number, number];

type Props = {
  onResolve: () => void;
};

/** Starter suggestions (#460): Flux, bottom-left, holding a one-time offer of places to begin. */
export function StarterSuggestionsBubble({ onResolve }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useEffectiveReducedMotion();
  const foreground = useThemeColor("foreground");

  const choose = (row: StarterRow) => {
    playSoftPress();
    onResolve();
    // Only Vent navigates yet; the other destinations land in #461/#462.
    if (row.id === "vent") router.push("/(protected)/voice-vent");
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" accessibilityViewIsModal>
      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: reduceMotion ? 0 : 200 }}
        style={StyleSheet.absoluteFill}
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        {/* Tap-away closes, same as ✕. Screen readers use ✕ instead. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onResolve} accessible={false} />
      </EaseView>

      <EaseView
        initialAnimate={{ opacity: 0, translateY: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: reduceMotion ? 150 : 320, easing: EASING }}
        className="absolute left-4 right-4"
        style={{ bottom: insets.bottom + 12 }}
      >
        <View className="rounded-3xl bg-surface p-4 gap-3">
          <View className="flex-row items-start">
            <View className="flex-1 pl-1 pt-1" accessibilityRole="header">
              <AppText className="text-lg font-semibold text-foreground">
                Where would you like to start?
              </AppText>
              <AppText className="text-sm text-muted">Suggested for you</AppText>
            </View>
            <CloseButton onPress={onResolve} accessibilityLabel="Close suggestions" />
          </View>

          <View className="gap-1">
            {STARTER_ROWS.map((row) => (
              <PressableFeedback
                key={row.id}
                onPress={() => choose(row)}
                accessibilityRole="button"
                accessibilityLabel={`${row.title}. ${row.subtitle}`}
              >
                <View className="flex-row items-center gap-4 rounded-2xl bg-default px-4 py-3">
                  <SymbolView
                    name={row.icon as any}
                    size={20}
                    tintColor={foreground}
                  />
                  <View className="flex-1">
                    <AppText className="text-base font-medium text-foreground">
                      {row.title}
                    </AppText>
                    <AppText className="text-sm text-muted" numberOfLines={1}>
                      {row.subtitle}
                    </AppText>
                  </View>
                </View>
              </PressableFeedback>
            ))}
          </View>
        </View>

        <Image
          source={FLUX}
          style={FLUX_STYLE}
          contentFit="contain"
          accessible={false}
        />
      </EaseView>
    </View>
  );
}
