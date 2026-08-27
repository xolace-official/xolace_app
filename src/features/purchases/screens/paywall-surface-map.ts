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
  // Voice picker reuses the existing "Mirror voice & tone" row — that row's
  // copy already covers voice, so no separate feature row is added.
  mirror_voice: "mirror_tone",
  daily_quote: "quotes",
  // Bridge has no feature row of its own — its cap lives under "Higher daily
  // limits" alongside reflections and vents.
  bridge_draft: "caps",
  settings_row: null,
  profile_row: null,
  // Every proactive moment sells the same capability — the thing that keeps
  // coming back, shown early — so they all highlight the insights row.
  session_close: "insights",
  mirror_landed: "insights",
  profile_insight: "insights",
};
