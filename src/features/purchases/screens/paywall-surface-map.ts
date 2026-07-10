import type { PaywallSurface } from "@/src/features/purchases/use-paywall";

/** Feature row ids rendered by paywall-feature-section.tsx. */
export type PaywallFeatureId =
  | "insights"
  | "themes"
  | "avatars"
  | "timeline"
  | "mirror_tone"
  | "quotes"
  | "caps";

/**
 * Which feature row to visually highlight, keyed by the surface that opened
 * the paywall. `null` surfaces are generic entry points (settings, profile)
 * with no single matching feature.
 */
export const PAYWALL_SURFACE_FEATURE: Record<PaywallSurface, PaywallFeatureId | null> = {
  insight_teaser: "insights",
  week_intensity: "insights",
  premium_theme: "themes",
  premium_avatar: "avatars",
  timeline_extended: "timeline",
  mirror_tone: "mirror_tone",
  daily_quote: "quotes",
  settings_row: null,
  profile_row: null,
};
