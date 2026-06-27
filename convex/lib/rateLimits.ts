import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

const DAY = 24 * HOUR;

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Session creation — 5/hour with burst allowance of 3
  sessionInitiate: { kind: "token bucket", rate: 5, period: HOUR, capacity: 3 },

  // AI mirror generation — main cost control
  aiMirrorRequest: { kind: "token bucket", rate: 8, period: HOUR, capacity: 2 },

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
});
