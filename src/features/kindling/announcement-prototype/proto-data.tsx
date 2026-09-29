// PROTOTYPE — throwaway (#457). Shared bits for the kindling-announcement variants.
// Three layouts of the same screen: A scatter, B grid, C orbit. Never merge.
import { View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, PressableFeedback } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import { TWIG_PRESENTATION, type Twig } from "@/src/features/kindling/twig-presentation";

export type Kind = Twig["kind"];
export const KINDS: Kind[] = ["breathing", "audio", "music", "xolacer", "read", "bridge"];

export type VariantProps = {
  variant: "plus" | "free";
  onSkip: () => void;
  onContinue: () => void;
  onPaywall: () => void;
};

export const COPY = {
  eyebrow: "Your kindling",
  title: "We're gathering a few things for you",
  body: "Small steps for after this — something to breathe with, hear, read, or share. It'll be waiting when you're done.",
  freeBody: "Xolace+ gathers a kindling after sessions like this one — small steps, picked for what you brought.",
};

// Decorative only, deliberately outside the theme tokens (#457). Tentative.
export const ACCENT: Record<Kind, string> = {
  breathing: "#7DD3C0",
  audio: "#F4A261",
  music: "#B48CF2",
  xolacer: "#F28CB1",
  read: "#8CB8F2",
  bridge: "#F2D06B",
};

// Arbitrary arc fill per ring — no meaning behind it.
export const ARC: Record<Kind, number> = {
  breathing: 1,
  audio: 0.72,
  music: 0.45,
  xolacer: 0.86,
  read: 0.6,
  bridge: 1,
};

// Stand-ins until the real poses land (prompts: docs/kindling-flux-poses.md). Swapping in
// `assets/images/flux/kindling/pose-<kind>.png` changes only this map.
export const POSE: Record<Kind, ImageSource> = {
  breathing: require("@/assets/images/flux/flux-campfire.png"),
  audio: require("@/assets/images/flux/flux-whisper.png"),
  music: require("@/assets/images/flux/jump-love-bgremove.png"),
  xolacer: require("@/assets/images/flux/flux-pair-listening.png"),
  read: require("@/assets/images/flux/writer-flux.png"),
  bridge: require("@/assets/images/flux/intro-2.png"),
};

export const FLUX_BUNDLE = require("@/assets/images/flux/flux-bundle.png");

/** One mascot circle with its decorative ring. Not interactive. */
export function Bubble({ kind, size }: { kind: Kind; size: number }) {
  const stroke = Math.max(3, size * 0.05);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={TWIG_PRESENTATION[kind].title}
      style={{ width: size, height: size }}
    >
      <View
        className="absolute overflow-hidden rounded-full"
        style={{ backgroundColor: `${ACCENT[kind]}33`, top: stroke * 1.8, left: stroke * 1.8, right: stroke * 1.8, bottom: stroke * 1.8 }}
      >
        <Image source={POSE[kind]} contentFit="contain" style={{ width: "100%", height: "100%" }} />
      </View>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={ACCENT[kind]} strokeOpacity={0.2} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ACCENT[kind]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * ARC[kind]} ${c}`}
          fill="none"
        />
      </Svg>
    </View>
  );
}

/** Top-right skip. One tap, always there. */
export function Skip({ onSkip }: { onSkip: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <PressableFeedback
      onPress={onSkip}
      accessibilityRole="button"
      accessibilityLabel="Skip"
      className="absolute right-4 z-10 rounded-full bg-foreground/10 px-4 py-2"
      style={{ top: insets.top + 8 }}
    >
      <AppText className="text-sm text-foreground">Skip</AppText>
    </PressableFeedback>
  );
}

/** Primary CTA — same slot for both tiers. */
export function Cta({ variant, onContinue, onPaywall }: VariantProps) {
  const plus = variant === "plus";
  const label = plus ? "Continue" : "Get my kindling with Xolace+";
  return (
    <Button
      onPress={plus ? onContinue : onPaywall}
      accessibilityRole="button"
      accessibilityLabel={label}
      size="lg"
      className="w-full"
    >
      <Button.Label>{label}</Button.Label>
    </Button>
  );
}
