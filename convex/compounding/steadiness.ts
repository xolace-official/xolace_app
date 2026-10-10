/**
 * Steadiness: a domain's decay-weighted mean of readings (#488), gated by the
 * warming → unlocked → settled states (#490). Pure and replayable: every
 * constant is a tuning knob, and calling with an earlier `now` replays the
 * past (trend, #510). No shrinkage — the shown number is the raw mean.
 */
import type { Domain } from "../lib/understandingVocab";
import { localDayKey } from "../streaks/activityLog";

const DAY_MS = 86_400_000;
const STEADINESS_HALF_LIFE_DAYS = 21;
export const BASELINE_HALF_LIFE_DAYS = 90;
export const QUIET_AFTER_DAYS = 30;
const UNLOCK_DAYS = 3;
const SETTLE_DAYS = 5;
const SETTLE_SPAN_DAYS = 21;
// "Your usual" is the readings older than this (#527): lately never counts
// toward it, so a sustained drop can't sink the usual it's measured against.
// Equal to the settle span, so every settled domain has a usual.
export const USUAL_AFTER_MS = SETTLE_SPAN_DAYS * DAY_MS;
const OVERALL_MIN_UNLOCKED = 2;

/** One dated piece of evidence about a domain, 0–100, higher = steadier. */
export type Reading = {
  domain: Domain;
  value: number;
  weight: number;
  at: number;
  source: "session" | "mood" | "follow_up";
};

export type DomainState = "warming" | "unlocked" | "settled";

export type DomainSteadiness = {
  domain: Domain;
  state: DomainState;
  /** Shown steadiness: null while warming. */
  steadiness: number | null;
  /** "Your usual", from readings older than USUAL_AFTER_MS: null until settled. */
  baseline: number | null;
  /** Ungated means, for replay and debugging — never put these on a screen. */
  raw: { steadiness: number; baseline: number };
  lastReadingAt: number;
  /** No reading for 30 days: the value holds, marked "last seen". */
  quiet: boolean;
  /** Sum of decayed weights at the steadiness half-life. */
  evidenceWeight: number;
  /** Distinct local days with a session reading. */
  sessionDays: number;
  readings: Reading[];
};

export function computeSteadiness(
  allReadings: Reading[],
  { now, timezone }: { now: number; timezone: string },
): { domains: DomainSteadiness[]; overall: number | null } {
  const byDomain = new Map<Domain, Reading[]>();
  for (const reading of allReadings) {
    if (reading.at > now) continue;
    byDomain.set(reading.domain, [...(byDomain.get(reading.domain) ?? []), reading]);
  }

  const domains = [...byDomain].map(([domain, readings]) =>
    domainSteadiness(domain, readings, now, timezone),
  );
  const unlocked = domains.filter((d) => d.state !== "warming");
  const overall =
    unlocked.length >= OVERALL_MIN_UNLOCKED
      ? unlocked.reduce((sum, d) => sum + d.raw.steadiness, 0) / unlocked.length
      : null;
  return { domains, overall };
}

function domainSteadiness(
  domain: Domain,
  readings: Reading[],
  now: number,
  timezone: string,
): DomainSteadiness {
  const sessions = readings.filter((r) => r.source === "session");
  const sessionDays = new Set(sessions.map((r) => localDayKey(r.at, timezone))).size;
  const firstSessionAt = Math.min(...sessions.map((r) => r.at));
  const lastReadingAt = Math.max(...readings.map((r) => r.at));

  const state: DomainState =
    sessionDays >= SETTLE_DAYS && now - firstSessionAt >= SETTLE_SPAN_DAYS * DAY_MS
      ? "settled"
      : sessionDays >= UNLOCK_DAYS
        ? "unlocked"
        : "warming";

  const short = decayedMean(readings, now, STEADINESS_HALF_LIFE_DAYS);
  // A settled domain always has a usual; the fallback only feeds raw for unsettled ones.
  const usual = usualOf(readings, now);
  const usualMean = decayedMean(usual.length ? usual : readings, now, BASELINE_HALF_LIFE_DAYS);
  return {
    domain,
    state,
    steadiness: state === "warming" ? null : short.mean,
    baseline: state === "settled" ? usualMean.mean : null,
    raw: { steadiness: short.mean, baseline: usualMean.mean },
    lastReadingAt,
    quiet: now - lastReadingAt >= QUIET_AFTER_DAYS * DAY_MS,
    evidenceWeight: short.weight,
    sessionDays,
    readings,
  };
}

/** The readings that count as the usual as of `at`: everything before lately. */
export function usualOf(readings: Reading[], at: number): Reading[] {
  return readings.filter((r) => r.at <= at - USUAL_AFTER_MS);
}

/**
 * Weighted mean with weight × 2^(−age / halfLife). Decay is relative to the
 * newest reading, not `now`: the ratio is the same either way, and anchoring
 * to `now` would underflow to 0/0 after a long silence. Silence holds. `sd`
 * is the weighted spread around that mean.
 */
export function decayedMean(readings: Reading[], now: number, halfLifeDays: number) {
  const newest = Math.max(...readings.map((r) => r.at));
  const halfLife = halfLifeDays * DAY_MS;
  const weights = readings.map((r) => r.weight * 2 ** (-(newest - r.at) / halfLife));
  const weight = weights.reduce((a, b) => a + b, 0);
  const mean = readings.reduce((sum, r, i) => sum + weights[i] * r.value, 0) / weight;
  const variance =
    readings.reduce((sum, r, i) => sum + weights[i] * (r.value - mean) ** 2, 0) / weight;
  // evidenceWeight is honest about age, so it decays with `now`.
  return { mean, sd: Math.sqrt(variance), weight: weight * 2 ** (-(now - newest) / halfLife) };
}
