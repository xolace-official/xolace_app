// PROTOTYPE — throwaway (#457). Variant C "Orbit": Flux in the middle with
// his bundle, the six poses haloed around him like sparks around the fire.
// One hero, no captions in the halo — the copy lives in a single line below.
import { useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/shared/app-text";
import { TWIG_PRESENTATION } from "@/src/features/kindling/twig-presentation";
import {
  Bubble, COPY, Cta, FLUX_BUNDLE, KINDS, Skip, type VariantProps,
} from "@/src/features/kindling/announcement-prototype/proto-data";

export function OrbitVariant(props: VariantProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const box = (width - 24) * 0.86;
  const bubble = box * 0.25;
  const radius = (box - bubble) / 2;
  const titles = KINDS.map((k) => TWIG_PRESENTATION[k].title.toLowerCase()).join(" · ");

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 140 }}>
      <Skip onSkip={props.onSkip} />
      <View className="self-center" style={{ width: box, height: box }}>
        <View className="absolute rounded-full border border-dashed border-foreground/10" style={{ inset: bubble / 2 }} />
        <Image
          source={FLUX_BUNDLE}
          contentFit="contain"
          accessibilityIgnoresInvertColors
          style={{ position: "absolute", width: box * 0.42, height: box * 0.42, left: box * 0.29, top: box * 0.29 }}
        />
        {KINDS.map((kind, i) => {
          const a = (i / KINDS.length) * 2 * Math.PI - Math.PI / 2;
          return (
            <View
              key={kind}
              className="absolute"
              style={{ left: radius + radius * Math.cos(a), top: radius + radius * Math.sin(a) }}
            >
              <Bubble kind={kind} size={bubble} />
            </View>
          );
        })}
      </View>
      <View className="mt-auto items-center gap-3 px-6">
        <AppText className="text-center font-serif text-3xl leading-9 text-foreground">{COPY.title}</AppText>
        <AppText className="text-center text-xs text-muted">{titles}</AppText>
        <AppText className="text-center text-base text-muted">
          {props.variant === "plus" ? COPY.body : COPY.freeBody}
        </AppText>
        <View className="mt-3 w-full">
          <Cta {...props} />
        </View>
      </View>
    </View>
  );
}
