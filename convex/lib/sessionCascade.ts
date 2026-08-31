import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import { purgeEpisodicEntries } from "../episodicMemory";
import { ACTIVE_STATUSES, cancelFollowUpWorkflow } from "../followUps";

/**
 * The reference graph for "what dies when a session dies."
 *
 * INVARIANT: every table with a `sessionId` field is either purged here or
 * listed in SESSION_ID_EXEMPT with a reason. `sessionCascade.test.ts` walks
 * the schema and fails if a new one appears in neither — the miss that left
 * `follow_up_cards` orphaned by dataRetention for three jobs' worth of drift.
 *
 * Callers: jobs/dataWipe, jobs/accountDeletion, jobs/dataRetention. Each used
 * to hand-roll this list; two of the three forgot follow-up cards.
 */
export const SESSION_CASCADE_TABLES = [
  "session_turns",
  "emotional_metadata",
  "follow_up_cards",
] as const;

/** Tables carrying a sessionId that intentionally outlive their session. */
export const SESSION_ID_EXEMPT = {
  escalation_events:
    "Safety-audit tombstone — retained (profileId stripped) even past account deletion; holds no user text by policy.",
  feedback:
    "Profile-scoped structural signal — anonymized in place on account deletion (owner link + text stripped), not cascaded with its session.",
} as const;

/**
 * Delete a batch of sessions and everything that hangs off them.
 *
 * Bounded by the caller: pass at most one transaction's worth of sessions.
 * Episodic entries are purged once for the whole batch (one namespace lookup)
 * before any row is deleted, so the embeddings never outlive their source.
 */
export async function purgeSessions(
  ctx: MutationCtx,
  emotionalProfileId: Id<"emotional_profiles">,
  sessions: Doc<"sessions">[],
): Promise<void> {
  if (sessions.length === 0) return;

  // Wipe parity (hard invariant): episodic embeddings die in the same
  // transaction that deletes the session rows — never a best-effort sidecar.
  await purgeEpisodicEntries(
    ctx,
    emotionalProfileId,
    sessions.map((s) => s._id),
  );

  for (const session of sessions) {
    // The TTS render of the user's own mirror — nothing else references this
    // blob, so it leaks into storage forever if we skip it.
    if (session.mirrorAudioStorageId) {
      await ctx.storage.delete(session.mirrorAudioStorageId);
    }

    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .unique();
    if (metadata) await ctx.db.delete("emotional_metadata", metadata._id);

    // Server-capped at MAX_TURNS (sessionTurns.ts), but drain in batches
    // anyway so a cap change can't silently strand rows.
    let turns;
    do {
      turns = await ctx.db
        .query("session_turns")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .take(10);
      for (const turn of turns) await ctx.db.delete("session_turns", turn._id);
    } while (turns.length === 10);

    // One card per session at most, but query by index rather than assume.
    const cards = await ctx.db
      .query("follow_up_cards")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .take(10);
    for (const card of cards) {
      if (ACTIVE_STATUSES.has(card.status)) {
        await cancelFollowUpWorkflow(ctx, card.workflowId);
      }
      await ctx.db.delete("follow_up_cards", card._id);
    }

    await ctx.db.delete("sessions", session._id);
  }
}
