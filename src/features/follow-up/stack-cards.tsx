import type { ComponentProps } from "react";
import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import { PressableFeedback, useThemeColor } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import { playSoftPress } from "@/src/lib/haptics";
import { cn } from "@/src/lib/utils";

// Shared across every card, not per instance: a chip tap swaps in the next
// step's cards at the same spot, and a double tap's second half must not land
// on them. One soft tap, one onPress. A real second press (retrying Done, back
// from crisis resources) is outside the window and still goes through.
const DOUBLE_TAP_MS = 500;
let lastPress = 0;

type Symbol = Exclude<ComponentProps<typeof SymbolView>["name"], string>;

// Placeholder SF Symbols / Material icons — 3D clay icons are planned (#446).
const ICONS = {
  sun: { ios: "sun.max", android: "wb_sunny", web: "wb_sunny" },
  cloud: { ios: "cloud", android: "cloud", web: "cloud" },
  rain: { ios: "cloud.rain", android: "rainy", web: "rainy" },
  seal: { ios: "checkmark.seal", android: "verified", web: "verified" },
  mic: { ios: "mic", android: "mic", web: "mic" },
  arrow: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  close: { ios: "xmark", android: "close", web: "close" },
  flame: { ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" },
  check: { ios: "checkmark", android: "check", web: "check" },
  music: { ios: "music.note", android: "music_note", web: "music_note" },
  waveform: { ios: "waveform", android: "graphic_eq", web: "graphic_eq" },
  book: { ios: "book", android: "menu_book", web: "menu_book" },
  lifebuoy: { ios: "lifepreserver", android: "support", web: "support" },
}satisfies Record<string, Symbol>;
export type IconKey = keyof typeof ICONS;

export function Icon({ name, size = 22 }: { name: IconKey; size?: number }) {
  const fg = useThemeColor("foreground") as string;
  return <SymbolView name={ICONS[name]} size={size} tintColor={fg} />;
}

const Bubble = ({ icon }: { icon: IconKey }) => (
  <View className="size-14 items-center justify-center rounded-full bg-background/80">
    <Icon name={icon} size={24} />
  </View>
);

type OptionProps = {
  icon: IconKey;
  tint: string;
  title: string;
  sub?: string;
  a11yLabel?: string;
  onPress: () => void;
};

/**
 * One tappable layer of the check-in stack: a tinted, top-rounded card that
 * slides under the next one (-mb-8 over pb-12). Keep this shape exactly — two
 * corner restyles were rejected in the #446 prototype.
 */
export function OptionCard({ icon, tint, title, sub, a11yLabel, onPress }: OptionProps) {
  const press = () => {
    const now = Date.now();
    if (now - lastPress < DOUBLE_TAP_MS) return;
    lastPress = now;
    playSoftPress();
    onPress();
  };
  return (
    <PressableFeedback
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? title}
      className="-mb-8 overflow-hidden rounded-t-[36px] bg-surface"
    >
      <View className={cn("flex-row items-center gap-4 px-5 pb-12 pt-5", tint)}>
        <Bubble icon={icon} />
        <View className="flex-1">
          <AppText className="font-medium text-xl leading-7 text-foreground">{title}</AppText>
          {sub ? <AppText className="text-sm text-foreground/55">{sub}</AppText> : null}
        </View>
        <View className="size-14 items-center justify-center rounded-full border border-foreground/20">
          <Icon name="arrow" size={18} />
        </View>
      </View>
    </PressableFeedback>
  );
}
