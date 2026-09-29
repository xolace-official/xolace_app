// PROTOTYPE — throwaway (#457). Variant A "Scatter": an organic, uneven
// cluster of six sizes up top — energetic, like sparks off the fire — copy
// and CTA anchored at the bottom. Captions under each circle.
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/shared/app-text";
import { TWIG_PRESENTATION } from "@/src/features/kindling/twig-presentation";
import { Bubble, COPY, Cta, KINDS, Skip, type VariantProps } from "@/src/features/kindling/announcement-prototype/proto-data";

// [x, y, size] as fractions of the cluster box width.
const LAYOUT = [
  [0.04, 0.08, 0.36],
  [0.46, 0.0, 0.3],
  [0.7, 0.3, 0.28],
  [0.08, 0.56, 0.26],
  [0.4, 0.42, 0.32],
  [0.72, 0.72, 0.24],
] as const;

export function ScatterVariant(props: VariantProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const box = width - 32;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 140 }}>
      <Skip onSkip={props.onSkip} />
      <View className="mx-4" style={{ width: box, height: box * 1.05 }}>
        {KINDS.map((kind, i) => {
          const [x, y, s] = LAYOUT[i];
          return (
            <View key={kind} className="absolute items-center" style={{ left: x * box - 12, top: y * box, width: s * box + 24 }}>
              <Bubble kind={kind} size={s * box} />
              <AppText className="mt-1 text-center text-[11px] text-muted" numberOfLines={2}>
                {TWIG_PRESENTATION[kind].title}
              </AppText>
            </View>
          );
        })}
      </View>
      <View className="mt-auto gap-3 px-6">
        <AppText className="text-xs uppercase tracking-widest text-accent">{COPY.eyebrow}</AppText>
        <AppText className="font-serif text-3xl leading-9 text-foreground">{COPY.title}</AppText>
        <AppText className="text-base text-muted">{props.variant === "plus" ? COPY.body : COPY.freeBody}</AppText>
        <View className="mt-3">
          <Cta {...props} />
        </View>
      </View>
    </View>
  );
}
