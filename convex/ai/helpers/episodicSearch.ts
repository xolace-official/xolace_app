import { rag } from "../../rag";

/**
 * One episodic memory that informed a mirror: composite text for the
 * articulator, RAG key (= sessionId) for Understanding provenance.
 */
export type EpisodicMatch = { text: string; key: string };

/**
 * The matches plus how well the best of them actually matched. `topScore` is
 * absent — never zero — when no memory was retained, because "didn't connect"
 * and "scored 0.0" are different facts and only the first is true here.
 *
 * `failed` marks the third fact: the search never ran. A refinement replaces
 * the episodic provenance of the row, so an outage must not be allowed to read
 * as "nothing matched" and wipe the keys the initial pass retrieved.
 */
export type EpisodicSearch = {
  matches: EpisodicMatch[];
  topScore?: number;
  failed?: boolean;
};

/**
 * Top-K episodic matches for the current input from the user's personal
 * namespace. Returns composite texts, newest-format
 * or metadata-only alike. Best-effort: any failure (no namespace yet,
 * embedding outage) returns no matches so memory can never block the mirror.
 *
 * Shared by the initial pass and every refinement turn — a refinement
 * re-searches against the accumulated input, because the detail that arrives
 * on turn 2 may be exactly what makes Tuesday relevant (§5.2).
 *
 * Deliberately no `vectorScoreThreshold`: vector search returns its nearest
 * neighbours however far away they are, so the score is the only thing that
 * says whether memory connected — but below-floor memories must still reach
 * the articulator, which flags them rather than filtering them out.
 */
export async function searchEpisodicMemory(
  ctx: Parameters<typeof rag.search>[0],
  emotionalProfileId: string,
  currentSessionId: string,
  rawText: string,
): Promise<EpisodicSearch> {
  try {
    const { entries, results } = await rag.search(ctx, {
      namespace: emotionalProfileId,
      query: rawText,
      limit: 4,
    });
    const retained = entries
      .filter((e) => e.key !== undefined && e.key !== currentSessionId)
      .slice(0, 3);
    const retainedIds = new Set(retained.map((e) => e.entryId));
    // Scores live on the sibling `results` array, joined by entryId. Taken as
    // returned by rag.search — never recomputed or normalised. Scoped to the
    // retained entries, not all results: the score has to describe the memory
    // that actually reached the articulator, and this session's own re-ingested
    // composite would otherwise near-perfectly self-match and read as connected.
    const scores = results
      .filter((r) => retainedIds.has(r.entryId))
      .map((r) => r.score);

    return {
      matches: retained.map((e) => ({ text: e.text, key: e.key as string })),
      topScore: scores.length > 0 ? Math.max(...scores) : undefined,
    };
  } catch {
    return { matches: [], failed: true };
  }
}
