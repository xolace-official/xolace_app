/**
 * Readings from what a person already gave us (#488): the session's
 * Understanding, its mood check, and later follow-up answers. Burned and
 * crisis sessions count like any other — burn takes a session off the
 * timeline, not out of the Understanding.
 */
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { domainOf, emotionFamily, type Domain } from "../lib/understandingVocab";
import type { Reading } from "./steadiness";

const VALENCE_FLOOR = 75;
const UNCONFIRMED_WEIGHT = 0.5;

const MOOD_STEP: Partial<Record<NonNullable<Doc<"sessions">["postSessionMood"]>, number>> = {
  lighter: 15,
  same: 0,
  heavier: -15,
};

const FOLLOW_UP_STEP: Partial<
  Record<NonNullable<Doc<"follow_up_cards">["userResponse"]>, number>
> = {
  lighter: 20,
  processed: 30,
  still_here: 0,
  heavier: -20,
};

/** The fields of one session (and its answered follow-ups) a reading needs. */
export type SessionEvidence = {
  at: number;
  intensity: number;
  primaryEmotion: string;
  thematicTags: string[];
  confirmationState?: Doc<"sessions">["confirmationState"];
  postSessionMood?: Doc<"sessions">["postSessionMood"];
  followUps: { response: string; at: number }[];
};

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export function readingsFromSession(s: SessionEvidence): Reading[] {
  const domains = new Set(
    s.thematicTags.map(domainOf).filter((d): d is Domain => d !== null),
  );
  if (domains.size === 0) return [];

  const linear = clamp(100 - ((s.intensity - 1) * 100) / 9);
  const family = emotionFamily(s.primaryEmotion);
  const value =
    family.includes("joy") || family.includes("love") ? Math.max(linear, VALENCE_FLOOR) : linear;
  // Confirmation says how far to trust the Understanding — and so every
  // reading built on it, self-reports included.
  const weight =
    s.confirmationState === "confirmed" || s.confirmationState === "refined"
      ? 1
      : UNCONFIRMED_WEIGHT;

  const points: Pick<Reading, "value" | "at" | "source">[] = [
    { value, at: s.at, source: "session" },
  ];
  const mood = s.postSessionMood ? MOOD_STEP[s.postSessionMood] : undefined;
  if (mood !== undefined) {
    points.push({ value: clamp(value + mood), at: s.at, source: "mood" });
  }
  for (const f of s.followUps) {
    const step = (FOLLOW_UP_STEP as Record<string, number | undefined>)[f.response];
    if (step !== undefined) points.push({ value: clamp(value + step), at: f.at, source: "follow_up" });
  }

  return [...domains].flatMap((domain) => points.map((p) => ({ ...p, domain, weight })));
}

// ponytail: newest 1000 metadata rows and 1000 cards per read (at most one card
// per session, so the cards cover those sessions). At a 90-day half-life older
// ones barely move the baseline; replace with a stored rollup if a heavy user nears it.
const MAX_SESSIONS = 1000;

/** Every reading that remains for a profile, plus the timezone days are cut in. */
export async function loadReadings(
  ctx: QueryCtx,
  profileId: Id<"emotional_profiles">,
): Promise<{ readings: Reading[]; timezone: string }> {
  const [metadata, cards, preferences] = await Promise.all([
    ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_createdAt", (q) => q.eq("emotionalProfileId", profileId))
      .order("desc")
      .take(MAX_SESSIONS),
    ctx.db
      .query("follow_up_cards")
      .withIndex("by_profile_created", (q) => q.eq("emotionalProfileId", profileId))
      .order("desc")
      .take(MAX_SESSIONS),
    ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
      .unique(),
  ]);

  const followUps = new Map<Id<"sessions">, SessionEvidence["followUps"]>();
  for (const card of cards) {
    if (!card.userResponse) continue;
    const answer = { response: card.userResponse, at: card.resolvedAt ?? card.createdAt };
    followUps.set(card.sessionId, [...(followUps.get(card.sessionId) ?? []), answer]);
  }

  // One metadata row per session (emotionalMetadata.store upserts).
  const sessions = await Promise.all(metadata.map((m) => ctx.db.get("sessions", m.sessionId)));
  const readings = metadata.flatMap((meta, i) => {
    const session = sessions[i];
    if (!session) return []; // purged by retention or a wipe
    return readingsFromSession({
      at: session.createdAt,
      intensity: meta.intensity,
      primaryEmotion: meta.primaryEmotion,
      thematicTags: meta.thematicTags,
      confirmationState: session.confirmationState,
      postSessionMood: session.postSessionMood,
      followUps: followUps.get(meta.sessionId) ?? [],
    });
  });
  return { readings, timezone: preferences?.notifications.timezone ?? "UTC" };
}
