/**
 * The insights screen. The free view (#517) is everything a person without
 * Xolace+ may see (CONTEXT.md "Free view"): the overall steadiness and each
 * touched domain's state. Per-domain numbers, "your usual" and the trend only
 * leave through plusView (#518), which re-checks the entitlement on every read.
 */
import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAuth } from "../lib/auth";
import { hasPremium } from "../lib/premium";
import { DOMAINS } from "../lib/understandingVocab";
import { loadReadings } from "./readings";
import { computeSteadiness, type DomainSteadiness } from "./steadiness";
import { trendFor } from "./trend";

const domainV = v.union(...DOMAINS.map((d) => v.literal(d)));
const nullableNumber = v.union(v.number(), v.null());

const freeDomain = {
  domain: domainV,
  state: v.union(v.literal("warming"), v.literal("unlocked"), v.literal("settled")),
  /** Set once a domain is quiet: "Not recently · last seen <date>". */
  lastSeenAt: nullableNumber,
};

/** Live first, quiet next, warming last (#491); compounding joins in #520. */
const rank = (d: DomainSteadiness) => (d.state === "warming" ? 2 : d.quiet ? 1 : 0);

const ordered = (domains: DomainSteadiness[]) =>
  domains.sort((a, b) => rank(a) - rank(b) || DOMAINS.indexOf(a.domain) - DOMAINS.indexOf(b.domain));

const freeFields = (d: DomainSteadiness) => ({
  domain: d.domain,
  state: d.state,
  lastSeenAt: d.quiet ? d.lastReadingAt : null,
});

const round = (n: number | null) => (n === null ? null : Math.round(n));

export const freeView = query({
  args: {},
  returns: v.object({ overall: nullableNumber, domains: v.array(v.object(freeDomain)) }),
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const { readings, timezone } = await loadReadings(ctx, profile._id);
    const { domains, overall } = computeSteadiness(readings, { now: Date.now(), timezone });
    return { overall: round(overall), domains: ordered(domains).map(freeFields) };
  },
});

/**
 * The free view plus each domain's number, "your usual" once settled, and the
 * 7-day trend (#510). Null without Xolace+, so a lapse drops back to the free
 * view; nothing is stored, so upgrading shows the full history at once.
 */
export const plusView = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      overall: nullableNumber,
      /** Mean of per-domain deltas; null under 2 domains or in a quiet week. */
      overallTrend: nullableNumber,
      domains: v.array(
        v.object({
          ...freeDomain,
          steadiness: nullableNumber,
          baseline: nullableNumber,
          /** Null when warming 7 days ago or quiet since; 0 = "same as last week". */
          trend: nullableNumber,
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    if (!(await hasPremium(ctx, profile))) return null;
    const { readings, timezone } = await loadReadings(ctx, profile._id);
    const now = Date.now();
    const { domains, overall } = computeSteadiness(readings, { now, timezone });
    const trend = trendFor(readings, { now, timezone });
    return {
      overall: round(overall),
      overallTrend: trend.overall,
      domains: ordered(domains).map((d) => ({
        ...freeFields(d),
        steadiness: round(d.steadiness),
        baseline: round(d.baseline),
        trend: trend.domains.get(d.domain) ?? null,
      })),
    };
  },
});
