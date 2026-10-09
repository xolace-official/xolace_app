/**
 * What the Reflection Agent gets to write steadiness insights from (#525):
 * the counted facts per domain (score, usual, trend, compounding with the
 * linked domains in onset order) and the citable sessions behind them, each
 * with when it happened in the person's own week, their words, what they
 * chose and how it sat afterwards. Code finds the facts; the model only
 * notices what they mean (ADR 0019). Burned sessions are never listed, so
 * they can't be cited; a crisis session gives its metadata only.
 */
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { internalQuery, type QueryCtx } from "../_generated/server";
import { readFollowUp } from "../ai/reflectionAgent/toolQueries";
import { hasPremium } from "../lib/premium";
import { DOMAIN_LABELS, LIFE_AREA_HOME, domainOf, type Domain, type ThematicTag } from "../lib/understandingVocab";
import { loadReadings } from "./readings";
import { computeSteadiness } from "./steadiness";
import { compoundingFor } from "./stretches";
import { trendFor } from "./trend";

// ponytail: the newest 60 sessions. Then-vs-now past that reaches back through search_episodic_memory.
const SESSIONS = 60;

/** What each post-mirror path meant, in words the model can use. */
const PATH_WORDS: Record<NonNullable<Doc<"sessions">["pathChosen"]>, string> = {
  solo: "stayed with it a while (Sit with this)",
  peers: "read how others put the same thing",
  exit: "just needed to say it, and left",
};

export const domainsOf = (tags: string[]) => [
  ...new Set(tags.map(domainOf).filter((d): d is Domain => d !== null)),
];

const isCrisis = (s: Doc<"sessions">, m: Doc<"emotional_metadata">) =>
  s.safeguardLevel === "crisis" || m.safeguardLevel === "crisis";

/** "Sun 7 Sep 2026, evening" in their timezone: the raw material for recurring shapes. */
export function when(at: number, timeZone: string) {
  const fmt = (tz: string) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", hourCycle: "h23",
    }).formatToParts(new Date(at));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const hour = Number(get("hour"));
    const part = hour < 5 ? "late night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "late night";
    return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}, ${part}`;
  };
  try {
    return fmt(timeZone);
  } catch {
    return fmt("UTC");
  }
}

/** Xolace+ with personal memory on: the only people the insight pass runs for. */
export const insightsEnabled = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  returns: v.boolean(),
  handler: async (ctx, { emotionalProfileId }) => {
    const profile = await ctx.db.get("emotional_profiles", emotionalProfileId);
    if (!profile || profile.dataWipeInProgress === true) return false;
    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", emotionalProfileId))
      .unique();
    if (prefs?.personalMemoryEnabled === false) return false;
    return await hasPremium(ctx, profile);
  },
});

/** The get_domain_steadiness tool. */
export const domainSteadiness = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, { emotionalProfileId: profileId }) => {
    const now = Date.now();
    const loaded = await loadReadings(ctx, profileId);
    const { readings, timezone } = loaded;
    const trend = trendFor(readings, { now, timezone });
    const live = new Map((await compoundingFor(ctx, profileId, { now, loaded })).map((c) => [c.domain, c]));

    const domains = computeSteadiness(readings, { now, timezone }).domains.map((d) => {
      const c = live.get(d.domain);
      return {
        domain: d.domain,
        label: DOMAIN_LABELS[d.domain],
        steadiness: Math.round(d.raw.steadiness),
        usual: Math.round(d.raw.baseline),
        weekTrend: trend.domains.get(d.domain) ?? null,
        quietSince: d.quiet ? when(d.lastReadingAt, timezone) : null,
        compounding: c
          ? {
              state: c.state,
              since: when(c.startedAt, timezone),
              returning: c.returning,
              // In the order they started slipping, this one included.
              linkedOnsetOrder: [...c.coDomains.map((o) => ({ domain: o.domain, at: o.firstBelowAt })), { domain: c.domain, at: c.startedAt }]
                .sort((a, b) => a.at - b.at)
                .map((o) => `${o.domain} (${when(o.at, timezone)})`),
            }
          : null,
      };
    });

    return { today: when(now, timezone), domains, sessions: await citableSessions(ctx, profileId, timezone) };
  },
});

async function citableSessions(ctx: QueryCtx, profileId: Id<"emotional_profiles">, timezone: string) {
  const metas = await ctx.db
    .query("emotional_metadata")
    .withIndex("by_profile_createdAt", (q) => q.eq("emotionalProfileId", profileId))
    .order("desc")
    .take(SESSIONS);
  const out = [];
  for (const m of metas) {
    const s = await ctx.db.get("sessions", m.sessionId);
    const domains = domainsOf(m.thematicTags);
    if (!s || s.kept === false || domains.length === 0) continue;
    const crisis = isCrisis(s, m);
    out.push({
      id: s._id,
      when: when(s.createdAt, timezone),
      domains,
      alsoAbout: m.thematicTags.filter((t) => LIFE_AREA_HOME[t as ThematicTag] === "texture"),
      emotion: m.granularLabel ?? m.primaryEmotion,
      intensity: m.intensity,
      theirWords: crisis ? [] : m.userLanguageTags,
      chose: s.pathChosen ? PATH_WORDS[s.pathChosen] : null,
      moodAfter: s.postSessionMood ?? null,
      checkIn: crisis ? null : await readFollowUp(ctx, s._id),
    });
  }
  return out;
}
