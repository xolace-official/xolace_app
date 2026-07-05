import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import type { Doc } from "../../_generated/dataModel";
import { writeCalibrationInternal } from "../../semanticProfiles";
import { posthog } from "../../posthog";

// =============================================================
// TONE / CALIBRATION ADAPTATION — Cognition Layer Phase 4, Loop #1.
//
// The "what lands" section of the semantic profile, learned per user. This
// is the loop that makes session 50 feel different from session 5 (doc §4.1).
//
// DETERMINISTIC BY DESIGN: calibration is derived in rule-code from the
// longitudinal signal the pipeline already captures — confirmation outcomes,
// mirror lengths, tone tallies, mood deltas. No model call, per the
// constitution rule ("no feature may call an LLM to re-derive something the
// Understanding already knows"). The articulator already READS this section
// via renderSemanticProfile; this module is the missing write side that the
// consolidation prompt reserves ("Leave the 'what lands' section alone. It is
// written by a separate process.").
//
// Runs on the consolidation cadence (final step of consolidationWorkflow),
// independent of the agent's narrative write, patching calibration in place
// through the sanctioned writeCalibrationInternal path.
// =============================================================

/** Deterministic writer — stamped like the model writers for attribution. */
export const CALIBRATION_VERSION = "calibration-v1-deterministic";

// Bounded scan window; the newest sessions carry the current "what lands".
const SIGNAL_WINDOW = 40;
// Below this many landed/missed outcomes the signal is noise — write nothing
// and let the profile stay quiet until there's real evidence.
const MIN_OUTCOMES = 5;
const MIN_TONE_SAMPLE = 3;
const MIN_LENGTH_SAMPLE = 3;
const MIN_MOOD_SAMPLE = 5;

type Outcome = "confirmed" | "refined" | "gave_up";

/** The raw statistical signal calibration is computed from. */
export interface CalibrationSignals {
  outcomes: Record<Outcome, number>;
  // Mirror character lengths bucketed by how they landed.
  lengthConfirmed: number[];
  lengthMissed: number[]; // refined + gave_up
  toneOutcomes: Record<string, { confirmed: number; total: number }>;
  mood: { lighter: number; same: number; heavier: number };
}

type SessionSignalRow = Pick<
  Doc<"sessions">,
  "confirmationState" | "toneUsed" | "mirrorText" | "postSessionMood"
>;

/** Fold a session window into the calibration signal (pure). */
export function deriveCalibrationSignals(
  rows: SessionSignalRow[],
): CalibrationSignals {
  const signals: CalibrationSignals = {
    outcomes: { confirmed: 0, refined: 0, gave_up: 0 },
    lengthConfirmed: [],
    lengthMissed: [],
    toneOutcomes: {},
    mood: { lighter: 0, same: 0, heavier: 0 },
  };

  for (const row of rows) {
    const state = row.confirmationState;
    // "abandoned" carries no signal about whether the mirror landed.
    if (state === "confirmed" || state === "refined" || state === "gave_up") {
      signals.outcomes[state] += 1;

      const len = row.mirrorText?.length;
      if (typeof len === "number" && len > 0) {
        if (state === "confirmed") signals.lengthConfirmed.push(len);
        else signals.lengthMissed.push(len);
      }

      if (row.toneUsed) {
        const bucket = (signals.toneOutcomes[row.toneUsed] ??= {
          confirmed: 0,
          total: 0,
        });
        bucket.total += 1;
        if (state === "confirmed") bucket.confirmed += 1;
      }
    }

    if (
      row.postSessionMood === "lighter" ||
      row.postSessionMood === "same" ||
      row.postSessionMood === "heavier"
    ) {
      signals.mood[row.postSessionMood] += 1;
    }
  }

  return signals;
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Derive the "what lands" calibration prose from the signal (pure). Returns
 * null when there isn't enough evidence — the profile stays quiet rather than
 * asserting a preference from noise. Each line is a directive the articulator
 * can act on; middling/ambiguous signals emit nothing on purpose.
 */
export function computeCalibration(signals: CalibrationSignals): string | null {
  const { confirmed, refined, gave_up } = signals.outcomes;
  const total = confirmed + refined + gave_up;
  if (total < MIN_OUTCOMES) return null;

  const lines: string[] = [];

  // 1. How readily the first mirror lands → claim strength.
  const confirmRate = confirmed / total;
  if (confirmRate >= 0.7) {
    lines.push(
      "Their first read usually lands. Trust a precise, confident mirror over a hedged one.",
    );
  } else if (confirmRate <= 0.4) {
    lines.push(
      "The first mirror often misses. Leave a little room and let the phrasing invite correction rather than claim certainty.",
    );
  }

  // 2. Mirror length preference — compare what landed vs what didn't.
  if (
    signals.lengthConfirmed.length >= MIN_LENGTH_SAMPLE &&
    signals.lengthMissed.length >= MIN_LENGTH_SAMPLE
  ) {
    const landed = median(signals.lengthConfirmed);
    const missed = median(signals.lengthMissed);
    if (landed < missed * 0.85) {
      lines.push("Shorter mirrors land better for them. Keep it tight.");
    } else if (landed > missed * 1.15) {
      lines.push(
        "They respond to fuller mirrors with more room, not one-liners.",
      );
    }
  }

  // 3. Which tone resonates — only meaningful once tone actually varies
  //    (today toneUsed echoes the preference; Loop #2 makes it vary).
  const tones = Object.entries(signals.toneOutcomes).filter(
    ([, s]) => s.total >= MIN_TONE_SAMPLE,
  );
  if (tones.length >= 2) {
    const ranked = tones
      .map(([tone, s]) => ({ tone, rate: s.confirmed / s.total }))
      .sort((a, b) => b.rate - a.rate);
    const [best, next] = ranked;
    if (best.rate - next.rate >= 0.2) {
      lines.push(`The ${best.tone} register tends to land best with them.`);
    }
  }

  // 4. Whether sessions tend to help — accompaniment vs resolution posture.
  const moodTotal =
    signals.mood.lighter + signals.mood.same + signals.mood.heavier;
  if (moodTotal >= MIN_MOOD_SAMPLE) {
    if (signals.mood.lighter / moodTotal >= 0.5) {
      lines.push("Sessions usually leave them lighter.");
    } else if (signals.mood.heavier / moodTotal >= 0.4) {
      lines.push(
        "Sessions don't reliably lift the weight; stay with them rather than trying to resolve it.",
      );
    }
  }

  return lines.length > 0 ? lines.join(" ") : null;
}

/**
 * Recompute and commit this person's calibration. Reads a bounded session
 * window, derives the signal, and writes the "what lands" section in place
 * via the sanctioned path. A no-op when evidence is thin or a wipe is in
 * progress. Invoked as the final step of consolidationWorkflow — deterministic
 * and cheap, so it runs every consolidation regardless of the agent's write.
 */
export const refreshCalibration = internalMutation({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId),
      )
      .order("desc")
      .take(SIGNAL_WINDOW);

    const calibration = computeCalibration(deriveCalibrationSignals(rows));
    if (!calibration) return null;

    const result = await writeCalibrationInternal(ctx, {
      emotionalProfileId: args.emotionalProfileId,
      calibration,
      writerVersion: CALIBRATION_VERSION,
    });

    if (result) {
      await posthog.capture(ctx, {
        distinctId: args.emotionalProfileId,
        event: "reflect_calibration_written",
        properties: { writerVersion: CALIBRATION_VERSION },
      });
    }
    return null;
  },
});
