import type { Doc } from "../../_generated/dataModel";
import { CATALOG_BY_KEY } from "./catalog";

/**
 * Kindling content binder (docs/paths-v1.md §2.3, §8; #332).
 *
 * The model picks an action TYPE; this pure function picks the concrete
 * target. Deterministic on Understanding fields + candidate rows only — no
 * clock, no randomness, no model call — so the same session always binds
 * the same slug and a re-run is a no-op.
 */

export type BindTrack = Pick<
  Doc<"audio_tracks">,
  "slug" | "family" | "topic" | "tags" | "active" | "series"
>;

export interface BindUnderstanding {
  primaryEmotion: string;
  secondaryEmotion?: string;
  thematicTags: string[];
  suggestedSpecialty: Doc<"emotional_metadata">["suggestedSpecialty"];
}

export type BoundParams = { slug: string } | { exercise: string } | { specialty: string };

/** Track 2 "Reality, Not False Hope" — the one cross-topic series (§3.1). */
export const REFRAME_SERIES = "reality-not-false-hope";

export function bindTwig(
  actionType: string,
  u: BindUnderstanding,
  tracks: readonly BindTrack[],
): BoundParams | null {
  switch (actionType) {
    case "breathing":
      return { exercise: "sit-with-this" };
    case "xolacer":
      // The person is chosen at read time by `xolacerChat.sessionSuggestion`
      // and never stored — only the ranker's resolved specialty travels.
      return u.suggestedSpecialty ? { specialty: u.suggestedSpecialty } : null;
    default:
      return bindTrack(actionType, u, tracks);
  }
}

function bindTrack(
  actionType: string,
  u: BindUnderstanding,
  tracks: readonly BindTrack[],
): { slug: string } | null {
  const entry = CATALOG_BY_KEY.get(actionType);
  if (!entry) return null;

  // Acuity `tier` is editorial (tone, review process, Browse grouping) — it
  // never gates binding. Standalones and episodes of a topic compete on tags.
  const family = actionType.startsWith("music_topic_") ? "music" : "support";
  const candidates = tracks.filter(
    (t) =>
      t.active &&
      t.family === family &&
      (actionType === "episode_reframe" ? t.series === REFRAME_SERIES : t.topic === actionType),
  );
  if (candidates.length === 0) return null;

  const wanted = new Set([
    u.primaryEmotion,
    ...(u.secondaryEmotion ? [u.secondaryEmotion] : []),
    ...u.thematicTags,
    ...entry.emotions,
    ...entry.themes,
  ]);
  const score = (t: BindTrack) => t.tags.filter((tag) => wanted.has(tag)).length;

  const best = [...candidates].sort(
    (a, b) => score(b) - score(a) || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
  )[0];
  return { slug: best.slug };
}
