/**
 * Steadiness insights in and out (#525). `save` is the write_insight tool:
 * it rebuilds the evidence from the database (never trusting the model's
 * copy), runs the gate, and stores what passes. `endRun` then drops every
 * earlier run's rows, so a run that finds nothing leaves nothing behind. `insightsFor` is the read: an insight whose cited
 * session has gone (retention, wipe) or burned is never shown.
 */
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalMutation, type QueryCtx } from "../_generated/server";
import { domainValidator } from "../lib/validators";
import { DIRECTIONS, INSIGHT_KINDS, gateInsight, type CitableSession } from "./insightGate";
import { domainsOf } from "./insightEvidence";
import { loadReadings } from "./readings";
import { computeSteadiness } from "./steadiness";

const PER_RUN = 4;
const ROWS = 50;

export const kindValidator = v.union(...INSIGHT_KINDS.map((k) => v.literal(k)));

const rowsOf = (ctx: QueryCtx, profileId: Id<"emotional_profiles">) =>
  ctx.db
    .query("steadiness_insights")
    .withIndex("by_emotionalProfileId_and_oldestCitedAt", (q) => q.eq("emotionalProfileId", profileId))
    .take(ROWS);

async function citable(
  ctx: QueryCtx,
  profileId: Id<"emotional_profiles">,
  id: string,
): Promise<CitableSession | null> {
  const sessionId = ctx.db.normalizeId("sessions", id);
  const session = sessionId && (await ctx.db.get("sessions", sessionId));
  if (!session || session.emotionalProfileId !== profileId || session.kept === false) return null;
  const meta = await ctx.db
    .query("emotional_metadata")
    .withIndex("by_session", (q) => q.eq("sessionId", session._id))
    .first();
  const cards = await ctx.db
    .query("follow_up_cards")
    .withIndex("by_session", (q) => q.eq("sessionId", session._id))
    .take(5);
  const lighter =
    session.postSessionMood === "lighter" ||
    cards.some((c) => c.userResponse === "lighter" || c.userResponse === "processed");
  return { id, at: session.createdAt, domains: domainsOf(meta?.thematicTags ?? []), lighter };
}

export const save = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    runAt: v.number(),
    kind: kindValidator,
    domains: v.array(domainValidator),
    text: v.string(),
    citedSessionIds: v.array(v.string()),
    direction: v.union(...DIRECTIONS.map((d) => v.literal(d))),
  },
  returns: v.string(),
  handler: async (ctx, { emotionalProfileId: profileId, runAt, ...draft }) => {
    const profile = await ctx.db.get("emotional_profiles", profileId);
    if (!profile || profile.dataWipeInProgress === true) return "Skipped (a data wipe is in progress).";

    const sessions = new Map<string, CitableSession>();
    for (const id of new Set(draft.citedSessionIds)) {
      const s = await citable(ctx, profileId, id);
      if (s) sessions.set(id, s);
    }
    const { readings, timezone } = await loadReadings(ctx, profileId);
    const domains = new Map(
      computeSteadiness(readings, { now: Date.now(), timezone }).domains.map((d) => [d.domain, d.raw]),
    );
    const gate = gateInsight(draft, { sessions, domains });
    if (!gate.ok) return `Rejected, not saved: ${gate.reason}`;

    const thisRun = (await rowsOf(ctx, profileId)).filter((r) => r.runAt === runAt);
    if (thisRun.length >= PER_RUN) return `Not saved: ${PER_RUN} insights is the most per run.`;
    const key = `${draft.kind}:${draft.domains.join()}`;
    if (thisRun.some((r) => `${r.kind}:${r.domains.join()}` === key)) {
      return "Not saved: you already wrote this kind of insight for this domain in this run.";
    }

    const cited = [...sessions.values()];
    await ctx.db.insert("steadiness_insights", {
      emotionalProfileId: profileId,
      kind: draft.kind,
      domains: draft.domains,
      text: draft.text.trim(),
      citedSessionIds: cited.map((s) => s.id as Id<"sessions">),
      oldestCitedAt: Math.min(...cited.map((s) => s.at)),
      runAt,
      writtenAt: Date.now(),
    });
    return "Saved.";
  },
});

/** An insight-enabled run finished: its set replaces every earlier run's. */
export const endRun = internalMutation({
  args: { emotionalProfileId: v.id("emotional_profiles"), runAt: v.number() },
  returns: v.null(),
  handler: async (ctx, { emotionalProfileId, runAt }) => {
    for (const row of await rowsOf(ctx, emotionalProfileId)) {
      if (row.runAt !== runAt) await ctx.db.delete("steadiness_insights", row._id);
    }
    return null;
  },
});

export const hasInsights = async (ctx: QueryCtx, profileId: Id<"emotional_profiles">) =>
  (await rowsOf(ctx, profileId)).length > 0;

export const insightValidator = v.object({
  kind: kindValidator,
  domains: v.array(domainValidator),
  text: v.string(),
  writtenAt: v.number(),
});

/** Newest first; only those whose every cited session is still here and kept. */
export async function insightsFor(ctx: QueryCtx, profileId: Id<"emotional_profiles">) {
  const out = [];
  for (const row of await rowsOf(ctx, profileId)) {
    const cited = await Promise.all(row.citedSessionIds.map((id) => ctx.db.get("sessions", id)));
    if (cited.some((s) => !s || s.kept === false)) continue;
    out.push({ kind: row.kind, domains: row.domains, text: row.text, writtenAt: row.writtenAt });
  }
  return out.sort((a, b) => b.writtenAt - a.writtenAt);
}
