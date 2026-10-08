/**
 * The insights screen (#517). The free view is everything a person without
 * Xolace+ may see (CONTEXT.md "Free view"): the overall steadiness and each
 * touched domain's state. Per-domain numbers never leave this query — the
 * Xolace+ fields (#518) get their own gated read.
 */
import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAuth } from "../lib/auth";
import { DOMAINS } from "../lib/understandingVocab";
import { loadReadings } from "./readings";
import { computeSteadiness, type DomainSteadiness } from "./steadiness";

const domainV = v.union(...DOMAINS.map((d) => v.literal(d)));

/** Live first, quiet next, warming last (#491); compounding joins in #520. */
const rank = (d: DomainSteadiness) => (d.state === "warming" ? 2 : d.quiet ? 1 : 0);

export const freeView = query({
  args: {},
  returns: v.object({
    overall: v.union(v.number(), v.null()),
    domains: v.array(
      v.object({
        domain: domainV,
        state: v.union(v.literal("warming"), v.literal("unlocked"), v.literal("settled")),
        /** Set once a domain is quiet: "Not recently · last seen <date>". */
        lastSeenAt: v.union(v.number(), v.null()),
      }),
    ),
  }),
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const { readings, timezone } = await loadReadings(ctx, profile._id);
    const { domains, overall } = computeSteadiness(readings, { now: Date.now(), timezone });
    return {
      overall: overall === null ? null : Math.round(overall),
      domains: domains
        .sort((a, b) => rank(a) - rank(b) || DOMAINS.indexOf(a.domain) - DOMAINS.indexOf(b.domain))
        .map((d) => ({
          domain: d.domain,
          state: d.state,
          lastSeenAt: d.quiet ? d.lastReadingAt : null,
        })),
    };
  },
});
