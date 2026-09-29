import type { ImageSource } from "expo-image";
import type { Twig } from "@/src/features/kindling/twig-presentation";

export type TwigKind = Twig["kind"];

/** All six, always — the announcement is the concept, not this session's twigs (#455). */
export const ANNOUNCEMENT_KINDS: TwigKind[] = ["breathing", "audio", "music", "xolacer", "read", "bridge"];

/**
 * Flux, one pose per twig kind (prompts: docs/kindling-flux-poses.md), hosted
 * in Convex storage like the `TWIG_PRESENTATION` images. Replacing a pose is a
 * URL swap here.
 */
const STORAGE = "https://energetic-guineapig-283.convex.cloud/api/storage";
export const POSE: Record<TwigKind, ImageSource> = {
  breathing: { uri: `${STORAGE}/379966f6-e54e-45f9-97d1-b2897230e3b2` },
  audio: { uri: `${STORAGE}/637bf533-a584-4add-9840-6edb07f1c591` },
  music: { uri: `${STORAGE}/5e7bac04-fd9b-45dd-a053-7648a2c3f91b` },
  xolacer: { uri: `${STORAGE}/c3517525-fd5a-43f6-859f-a6744e283344` },
  read: { uri: `${STORAGE}/8530a88f-37c1-45a3-ab2f-3635a4f70ce1` },
  bridge: { uri: `${STORAGE}/e1069c9d-e99f-46d8-b47f-49cd07e7a062` },
};

/** Transparent poses: shown whole on the circle's tint. The rest carry a scene and fill the circle. */
export const CLEAN_POSES = new Set<TwigKind>(["audio", "xolacer"]);

/**
 * Ring accents — decorative, deliberately outside the theme tokens (#457), so
 * they read the same in every theme. Tentative.
 */
export const RING_ACCENT: Record<TwigKind, string> = {
  breathing: "#7DD3C0",
  audio: "#F4A261",
  music: "#B48CF2",
  xolacer: "#F28CB1",
  read: "#8CB8F2",
  bridge: "#F2D06B",
};

/** How much of each ring is drawn. Arbitrary — no data behind it. */
export const RING_ARC: Record<TwigKind, number> = {
  breathing: 1,
  audio: 0.72,
  music: 0.45,
  xolacer: 0.86,
  read: 0.6,
  bridge: 1,
};
