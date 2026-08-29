import { useMemo } from "react";
import { Platform, View, type ViewStyle } from "react-native";
import {
  Canvas,
  Group,
  Image as SkiaImage,
  RoundedRect,
  useImage,
} from "@shopify/react-native-skia";
import { Image as ExpoImage } from "expo-image";

import { createFounderClipPath } from "./clip-paths";
import type { FounderMarqueeCard } from "./marquee-data";

// PROTOTYPE — throwaway. Adapted from biscuit-camera's MarqueeCard: coloured
// RoundedRect frame + a Skia-clipped photo inset. Only the clip shapes changed.

const FRAME_RADIUS = 26;
const INSET = 14;
const IMAGE_RADIUS = 20;

const DROP_SHADOW: ViewStyle =
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: "black",
      shadowOffset: { width: -10, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
    android: { elevation: 10 },
    default: {},
  }) ?? {};

type Props = {
  card: FounderMarqueeCard;
  width: number;
  height: number;
  rotationDeg?: number;
};

export const FounderCard = ({ card, width, height, rotationDeg = 0 }: Props) => {
  const skImage = useImage(card.image);
  const innerW = width - INSET * 2;
  const innerH = height - INSET * 2;

  const clip = useMemo(
    () => createFounderClipPath(card.shape, innerW, innerH),
    [card.shape, innerW, innerH],
  );

  return (
    <View
      style={{
        width,
        height,
        borderRadius: FRAME_RADIUS,
        transform: [{ rotate: `${rotationDeg}deg` }],
        ...DROP_SHADOW,
      }}
    >
      <Canvas style={{ width, height }}>
        <RoundedRect x={0} y={0} width={width} height={height} r={FRAME_RADIUS} color={card.frameColor} />
        <Group
          clip={clip}
          transform={[{ translateX: INSET }, { translateY: INSET }]}
        >
          {skImage ? (
            <SkiaImage image={skImage} x={0} y={0} width={innerW} height={innerH} fit="cover" />
          ) : null}
        </Group>
      </Canvas>
      {/* Warm the expo-image decode cache so the same asset elsewhere is instant. */}
      {!skImage ? (
        <ExpoImage source={card.image} style={{ width: 1, height: 1, opacity: 0 }} />
      ) : null}
    </View>
  );
};
