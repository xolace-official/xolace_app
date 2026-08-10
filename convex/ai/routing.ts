// =============================================================
// UNCERTAINTY ROUTING — Cognition Layer Phase 4, Loop #2.
//
// System 1 (the hot path) stays deterministic forever (decision-log #8):
// this is rule-code, never a model call. It reads the classifier's own
// confidence about tonight's read — primaryEmotionConfidence (how sure it is
// of the emotion) and specificity (how clearly the feeling has a shape) — and
// gates the articulator's CLAIM STRENGTH:
//
//   low confidence + low shape   → tentative: offer the mirror as a naming
//                                  that invites correction, don't assert.
//   high confidence + high shape → confident: full precision, no hedging.
//   everything else              → measured: the normal path.
//
// This is the per-session, in-the-moment counterpart to Loop #1's calibration
// (the longitudinal "what lands" prior). Both push claim strength: calibration
// is what this person TENDS to need, routing is what TONIGHT'S read warrants.
// The articulator holds both and lets them compose.
//
// The doc also frames this as the Plus model-tiering lever ("low/low → a
// stronger model tier"). That hook is deferred until the Plus tiering infra
// lands; today the signal only shapes the prompt. Claim strength is a pure
// function of confidence + specificity — both already live in
// emotional_metadata — so it is never persisted (nothing to re-derive that
// the Understanding doesn't already hold); it is recomputed wherever needed.
// =============================================================

export type ClaimStrength = "tentative" | "measured" | "confident";

// primaryEmotionConfidence is 0-1; specificity is the classifier's 0-10 scale.
// HIGH_SPECIFICITY mirrors the articulator's own highSpecificity cutoff (6).
const LOW_CONFIDENCE = 0.5;
const HIGH_CONFIDENCE = 0.75;
const LOW_SPECIFICITY = 4;
const HIGH_SPECIFICITY = 6;

export interface UncertaintySignal {
  /** primaryEmotionConfidence, 0-1. */
  confidence: number;
  /** classifier specificity, 0-10. */
  specificity: number;
}

/**
 * Deterministically route the mirror's claim strength from how sure the
 * classifier is about tonight's read. Pure — the whole hot path stays
 * rule-code. Low confidence AND low shape → tentative; high AND high →
 * confident; anything mixed or middling → measured (the normal path).
 */
export function routeUncertainty({
  confidence,
  specificity,
}: UncertaintySignal): ClaimStrength {
  if (confidence < LOW_CONFIDENCE && specificity < LOW_SPECIFICITY) {
    return "tentative";
  }
  if (confidence >= HIGH_CONFIDENCE && specificity >= HIGH_SPECIFICITY) {
    return "confident";
  }
  return "measured";
}
