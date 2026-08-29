import type { FounderCardShape } from "./clip-paths";

// PROTOTYPE — throwaway. Reuses the onboarding "moods" imagery (real, on-brand
// twilight photos, no network). One card per shape — no duplicates (#236).

export type FounderMarqueeCard = {
  id: string;
  /** Metro `require()` asset id — accepted by both Skia `useImage` and expo-image. */
  image: number;
  frameColor: string;
  shape: FounderCardShape;
};

export const FOUNDER_MARQUEE_CARDS: FounderMarqueeCard[] = [
  {
    id: "heavy",
    image: require("@/assets/images/onboarding/heavy-mini.jpeg"),
    frameColor: "#3b2f5c",
    shape: "roundedRect",
  },
  {
    id: "anxious",
    image: require("@/assets/images/onboarding/Anxious-mini.jpeg"),
    frameColor: "#4e3658",
    shape: "portal",
  },
  {
    id: "numb",
    image: require("@/assets/images/onboarding/numb-mini.jpeg"),
    frameColor: "#2b3544",
    shape: "blob",
  },
  {
    id: "restless",
    image: require("@/assets/images/onboarding/restless-mini.jpeg"),
    frameColor: "#3a2c3f",
    shape: "flower",
  },
  {
    id: "lost",
    image: require("@/assets/images/onboarding/Lost-mini.jpeg"),
    frameColor: "#1e1a2e",
    shape: "circle",
  },
];
