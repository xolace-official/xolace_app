// PROTOTYPE — throwaway (#457). Variant B "Grid": headline first, then a calm
// 2×3 menu of what a kindling can hold — each circle with its eyebrow + title.
// Reads as "here's the concept", least showy, most explanatory.
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/shared/app-text";
import { TWIG_PRESENTATION } from "@/src/features/kindling/twig-presentation";
import { Bubble, COPY, Cta, KINDS, Skip, type VariantProps } from "@/src/features/kindling/announcement-prototype/proto-data";

export function GridVariant(props: VariantProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cell = (width - 48 - 16) / 2;

  return (
    <View className="flex-1 bg-surface-secondary">
      <Skip onSkip={props.onSkip} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: insets.bottom + 200, paddingHorizontal: 24 }}>
        <AppText className="text-center text-xs uppercase tracking-widest text-accent">{COPY.eyebrow}</AppText>
        <AppText className="mt-2 text-center font-serif text-3xl leading-9 text-foreground">{COPY.title}</AppText>
        <View className="mt-8 flex-row flex-wrap justify-between gap-y-6">
          {KINDS.map((kind) => (
            <View key={kind} className="items-center" style={{ width: cell }}>
              <Bubble kind={kind} size={cell * 0.62} />
              <AppText className="mt-2 text-[11px] uppercase tracking-wider text-muted">{TWIG_PRESENTATION[kind].eyebrow}</AppText>
              <AppText className="text-center text-sm font-medium text-foreground">{TWIG_PRESENTATION[kind].title}</AppText>
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="absolute inset-x-0 bottom-0 gap-3 bg-surface-secondary px-6 pt-4" style={{ paddingBottom: insets.bottom + 64 }}>
        <AppText className="text-center text-sm text-muted">{props.variant === "plus" ? COPY.body : COPY.freeBody}</AppText>
        <Cta {...props} />
      </View>
    </View>
  );
}
