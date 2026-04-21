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

  // Resonance toggle abuse prevention
  resonanceToggle: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },

  // Data wipe — once per 7 days (wipeInProgress flag handles in-flight dedup)
  dataWipe: { kind: "fixed window", rate: 1, period: 7 * DAY },
});
