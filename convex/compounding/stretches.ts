/**
 * Compounding stretches (#519): stored rows (ADR 0020) judged live by the
 * rules in detect.ts (#489).
 *
 * evaluateCompounding runs inside every mutation that writes a reading
 * (session completion, the mood check, a follow-up answer), so a stretch
 * moves in the same transaction as the reading that moved it. compoundingFor
 * is the pure read every consumer shares (#492).
 *
 * Neither reads nor writes safeguard state (riskFlag, safeguardLevel,
 * escalation), and safeguard never reads this: separate axes, no cross-feed.
 */
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalMutation, type MutationCtx, type QueryCtx } from "../_generated/server";
import { domainOf, type Domain } from "../lib/understandingVocab";
import { judgeOpen, opens, sharedSessions, shareTrend } from "./detect";
import { loadReadings } from "./readings";
import { computeSteadiness } from "./steadiness";

const RETURNING_MS = 30 * 86_400_000;
const LINK_MIN_SESSIONS = 2;

export type Compounding = {
  domain: Domain;
  state: "compounding" | "easing";
  /** Points below the (anchored) baseline. */
  gap: number;
  /** The usual it's judged against: the anchor for 90 days, then the live baseline. */
  baseline: number;
  band: number;
  /** Started within 30 days of this domain's previous stretch ending. */
  returning: boolean;
  /** 21-day share of sessions minus 90-day share; ranking only. */
  shareTrend: number;
  /** domain:startedAt — stable for the life of the stretch. */
  stretchId: string;
  startedAt: number;
  /** Linked domains, in the order their stretches started. */
  coDomains: { domain: Domain; firstBelowAt: number }[];
};

/** This domain's newest stretch and the one before it. */
const newestStretches = (ctx: QueryCtx, profileId: Id<"emotional_profiles">, domain: Domain) =>
  ctx.db
    .query("compounding_stretches")
    .withIndex("by_emotionalProfileId_and_domain_and_startedAt", (q) =>
      q.eq("emotionalProfileId", profileId).eq("domain", domain),
    )
    .order("desc")
    .take(2);

/**
 * Close what has ended and open what the landing session tipped in. Pass
 * `sessionId` only for a session reading: self-reports can close a stretch,
 * never open one. Idempotent: a second run in the same moment changes nothing.
 */
export async function evaluateCompounding(
  ctx: MutationCtx,
  profileId: Id<"emotional_profiles">,
  { sessionId }: { sessionId?: Id<"sessions"> } = {},
): Promise<void> {
  const now = Date.now();
  const opening = new Set<Domain>();
  if (sessionId) {
    const meta = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    for (const tag of meta?.thematicTags ?? []) {
      const domain = domainOf(tag);
      if (domain) opening.add(domain);
    }
  }

  const { readings, timezone } = await loadReadings(ctx, profileId);
  const clock = { now, timezone };
  for (const d of computeSteadiness(readings, clock).domains) {
    const [newest] = await newestStretches(ctx, profileId, d.domain);
    if (newest && newest.endedAt === undefined) {
      const judged = judgeOpen(d, newest, clock);
      if (!("ended" in judged)) continue;
      await ctx.db.patch("compounding_stretches", newest._id, { endedAt: judged.endedAt });
      // Back to the usual just now: hysteresis says it can't reopen in the same breath.
      if (judged.ended === "usual") continue;
    }
    if (opening.has(d.domain) && opens(d, clock)) {
      await ctx.db.insert("compounding_stretches", {
        emotionalProfileId: profileId,
        domain: d.domain,
        startedAt: now,
        anchorBaseline: d.raw.baseline,
      });
    }
  }
}

/**
 * The same evaluation in its own transaction, for a caller that completes
 * many sessions at once (the abandoned-session cron): one loadReadings per
 * session would blow that batch's read limit.
 */
export const evaluate = internalMutation({
  args: { profileId: v.id("emotional_profiles"), sessionId: v.optional(v.id("sessions")) },
  returns: v.null(),
  handler: async (ctx, { profileId, sessionId }) => {
    await evaluateCompounding(ctx, profileId, { sessionId });
    return null;
  },
});

/**
 * Every domain compounding or easing right now, ranked by gap then share
 * trend (#489). Rows plus live readings, nothing written: a quiet or released
 * stretch reads as ended here before any evaluation writes it. For everyone;
 * gating Xolace+ is each consumer's job (#496).
 */
export async function compoundingFor(
  ctx: QueryCtx,
  profileId: Id<"emotional_profiles">,
  { now = Date.now(), loaded }: { now?: number; loaded?: Awaited<ReturnType<typeof loadReadings>> } = {},
): Promise<Compounding[]> {
  const { readings, timezone } = loaded ?? (await loadReadings(ctx, profileId));
  const live: Omit<Compounding, "coDomains">[] = [];
  for (const d of computeSteadiness(readings, { now, timezone }).domains) {
    const [row, previous] = await newestStretches(ctx, profileId, d.domain);
    if (!row || row.endedAt !== undefined) continue;
    const judged = judgeOpen(d, row, { now, timezone });
    if ("ended" in judged) continue;
    live.push({
      ...judged,
      domain: d.domain,
      returning:
        previous?.endedAt !== undefined && row.startedAt - previous.endedAt <= RETURNING_MS,
      shareTrend: shareTrend(readings, d.domain, now),
      stretchId: `${d.domain}:${row.startedAt}`,
      startedAt: row.startedAt,
    });
  }

  return live
    .sort((a, b) => b.gap - a.gap || b.shareTrend - a.shareTrend)
    .map((c) => ({
      ...c,
      coDomains: live
        .filter(
          (o) =>
            o.domain !== c.domain &&
            sharedSessions(readings, c.domain, o.domain, now) >= LINK_MIN_SESSIONS,
        )
        .map((o) => ({ domain: o.domain, firstBelowAt: o.startedAt }))
        .sort((a, b) => a.firstBelowAt - b.firstBelowAt),
    }));
}
