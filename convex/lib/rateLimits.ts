import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

const DAY = 24 * HOUR;

// Plus overrides — 2x the free rate/capacity, same ratio, passed as an
// inline `config` override at the call site (free-tier config above stays
// the registered default). Easy to tune independently later.
export const SESSION_INITIATE_LIMITS_PLUS = {
  kind: "token bucket",
  rate: 10,
  period: HOUR,
  capacity: 5,
} as const;
export const AI_MIRROR_LIMITS_PLUS = {
  kind: "token bucket",
  rate: 16,
  period: HOUR,
  capacity: 4,
} as const;

// Trusted Bridge drafts. The bucket counts Anthropic CALLS, not drafts: the
// product promise is 1 draft/day free and 5/day Plus, each with one free
// regeneration (change the recipient, try again). A call that fails or returns
// empty is refunded, so a user never loses a draft to our error.
//
// Anything user-facing must divide by BRIDGE_CALLS_PER_DRAFT — "2 calls left"
// is one draft plus its retry, and rendering it as two drafts is a lie.
export const BRIDGE_CALLS_PER_DRAFT = 2;
export const BRIDGE_DRAFTS_FREE = 1;
export const BRIDGE_DRAFTS_PLUS = 5;

export const BRIDGE_DRAFT_LIMITS_PLUS = {
  kind: "fixed window",
  rate: BRIDGE_DRAFTS_PLUS * BRIDGE_CALLS_PER_DRAFT,
  period: DAY,
} as const;

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Session creation — 5/hour with burst allowance of 3
  sessionInitiate: { kind: "token bucket", rate: 5, period: HOUR, capacity: 3 },

  // AI mirror generation — main cost control
  aiMirrorRequest: { kind: "token bucket", rate: 8, period: HOUR, capacity: 2 },

  // Trusted Bridge draft generation — free tier default (1 draft + 1 retry).
  // Plus widens the same bucket via BRIDGE_DRAFT_LIMITS_PLUS at the call site.
  bridgeDraft: {
    kind: "fixed window",
    rate: BRIDGE_DRAFTS_FREE * BRIDGE_CALLS_PER_DRAFT,
    period: DAY,
  },

  // Notification spam prevention — 1 per 24 hours
  notification: { kind: "fixed window", rate: 1, period: DAY },

  // Follow-up nudge (elevated / standard tiers) — SEPARATE bucket so a
  // follow-up check-in never starves (or is starved by) gentle_return /
  // pattern_nudge. These tiers space their two nudges >=24h apart, so a
  // 1 per 24h per profile cap is the right gentle guard.
  followUpNudge: { kind: "fixed window", rate: 1, period: DAY },

  // Acute follow-up (safeguard crisis) — the presence-check workflow fires
  // TWICE inside ~5h (nudge #1 at 45m, nudge #2 ~4h later). The 1/day
  // followUpNudge cap would silently drop that second presence check, which
  // for a crisis tier reads as abandonment. Give acute its own budget sized
  // for both nudges plus a little headroom for a same-day supersede re-trigger.
  followUpAcute: { kind: "fixed window", rate: 3, period: DAY },

  // Resonance toggle abuse prevention
  resonanceToggle: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },

  // Data wipe — once per 7 days (wipeInProgress flag handles in-flight dedup)
  dataWipe: { kind: "fixed window", rate: 1, period: 7 * DAY },

  // Reflection reports — 5 per day to prevent abuse
  reportReflection: { kind: "fixed window", rate: 5, period: DAY },

  // General settings feedback — 5 per 24h per profile
  generalFeedback: { kind: "fixed window", rate: 5, period: DAY },

  // Product feedback (shake-summoned bug/idea tray) — shake submission is
  // easy to spam, so this guard is not optional. 10 per 24h per profile.
  productFeedback: { kind: "fixed window", rate: 10, period: DAY },

  // Reflection Agent light pass (Cognition Layer Phase 3) — runs ~1/session.
  // Token bucket ~12/hour, capacity 4: a pure runaway guard, generous enough
  // that a normal burst of completions never drops a trajectory refresh.
  reflectionLightPass: { kind: "token bucket", rate: 12, period: HOUR, capacity: 4 },

  // Reflection Agent consolidation pass — the deep Sonnet tool loop. This is
  // the per-user token budget (doc §3): ~4/day per profile. A global
  // pool-ceiling bucket is a noted hardening TODO.
  reflectionConsolidation: { kind: "fixed window", rate: 4, period: DAY },
});
