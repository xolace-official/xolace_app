import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  internalAction,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { rag, NO_GRANULAR_LABEL, EPISODIC_STATUS } from "./rag";
import {
  DEFAULT_IMPORTANCE,
  isActionableFeedback,
  type MemoryFeedback,
} from "./episodicImportance";

// =============================================================
// EPISODIC MEMORY — per-session composite documents, semantically
// searchable in the user's PERSONAL namespace (Cognition Layer §1.1).
//
// namespace = emotionalProfileId → never cross-user by construction.
// key = sessionId → re-ingestion is an idempotent replace, and
// retention purges / data wipes cascade by key. Wipe parity is a
// hard invariant: the purge lives in the SAME jobs that delete
// sessions (jobs/dataRetention.ts, jobs/dataWipe.ts,
// jobs/accountDeletion.ts), never a best-effort sidecar.
//
// Composite (decision log #1 — raw text IS in):
//   [raw user text]     max matching + verbatim recall fidelity
//   [mirror text]       the AI's articulation
//   [distilledText]     compressed emotional core, when it exists
//   [metadata line]     emotion / intensity / tags / temporal context
//
// Metadata-only embedding (no raw/mirror/distilled text) when:
//   - the session is crisis-level (§6 v1 default — trajectory value
//     without storing crisis text), or
//   - the user turned personal memory off (§1.1b toggle).
// Burned sessions (kept === false) are never embedded at all.
// =============================================================

interface EpisodicSource {
  emotionalProfileId: Id<"emotional_profiles">;
  rawInput: string | null;
  mirrorText: string | null;
  distilledText: string | null;
  metadataLine: string;
  primaryEmotion: string;
  granularLabel: string | null;
  metadataOnly: boolean;
  // Learned salience weight (Loop #3), mirrored into the RAG vector's
  // native importance so re-ingestion preserves it instead of resetting to 1.
  importance: number;
}

/** Concatenate the composite document for embedding. */
function buildComposite(source: EpisodicSource): string {
  if (source.metadataOnly) {
    return source.metadataLine;
  }
  const parts = [
    source.rawInput,
    source.mirrorText,
    source.distilledText,
    source.metadataLine,
  ].filter((p): p is string => !!p && p.trim().length > 0);
  return parts.join("\n\n");
}

/**
 * Everything needed to embed one session, or null when the session
 * should not be in memory (missing, burned, or never classified).
 */
export const getSessionForEpisodic = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args): Promise<EpisodicSource | null> => {
    const session = await ctx.db.get("sessions", args.sessionId);
    if (!session) return null;

    // Burned / ephemeral sessions never enter memory.
    if (session.kept === false) return null;

    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    // No classification → mirror never happened → nothing to remember.
    if (!metadata) return null;

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", session.emotionalProfileId),
      )
      .unique();

    // undefined = on by default (§1.1b).
    const personalMemoryEnabled = preferences?.personalMemoryEnabled !== false;
    // Crisis sessions embed metadata-only until the §6 revisit lands.
    const isCrisis = session.safeguardLevel === "crisis";

    const metadataLine = [
      `emotion: ${metadata.primaryEmotion}`,
      metadata.granularLabel ? `granular: ${metadata.granularLabel}` : null,
      `intensity: ${metadata.intensity}/10`,
      metadata.thematicTags.length > 0
        ? `themes: ${metadata.thematicTags.join(", ")}`
        : null,
      metadata.userLanguageTags.length > 0
        ? `their words: ${metadata.userLanguageTags.join(", ")}`
        : null,
      metadata.temporalContext ? `temporal: ${metadata.temporalContext}` : null,
    ]
      .filter((p): p is string => !!p)
      .join(" | ");

    return {
      emotionalProfileId: session.emotionalProfileId,
      rawInput: session.rawInput ?? null,
      mirrorText: session.mirrorText ?? null,
      distilledText: session.distilledText ?? null,
      metadataLine,
      primaryEmotion: metadata.primaryEmotion,
      granularLabel: metadata.granularLabel ?? null,
      metadataOnly: isCrisis || !personalMemoryEnabled,
      importance: metadata.episodicImportance ?? DEFAULT_IMPORTANCE,
    };
  },
});

/**
 * Embed one session into its owner's personal namespace. Keyed on the
 * session id → replaces cleanly on re-run. When the session should not
 * be in memory (deleted, burned, unclassified), any previously indexed
 * entry is purged so stale text doesn't linger in the vector store.
 */
export const ingestSession = internalAction({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const source = await ctx.runQuery(
      internal.episodicMemory.getSessionForEpisodic,
      { sessionId: args.sessionId },
    );

    if (!source) {
      // We don't know the owner namespace from a deleted session; the
      // retention/wipe jobs handle that path with the profile id in hand.
      // This purge covers the burned/unclassified cases.
      return;
    }

    if (!source.metadataOnly && !source.rawInput && !source.mirrorText) {
      return;
    }

    await rag.add(ctx, {
      namespace: source.emotionalProfileId,
      key: args.sessionId,
      text: buildComposite(source),
      // Learned salience (Loop #3). Default 1 until feedback moves it; passed
      // on every (re-)ingest so a re-embed never resets an adjusted weight.
      importance: source.importance,
      // All three declared filters are required on every add (see rag.ts).
      // status is inert here — personal memory search never filters on it.
      filterValues: [
        { name: "primaryEmotion", value: source.primaryEmotion },
        { name: "granularLabel", value: source.granularLabel ?? NO_GRANULAR_LABEL },
        { name: "status", value: EPISODIC_STATUS },
      ],
    });
  },
});

/**
 * Phase 4, Loop #3 — apply confirmation feedback to the episodic memories
 * that informed a mirror. For each matched memory: nudge its stored weight
 * (cheap, transactional) and, only if it actually moved, re-embed so the new
 * importance reaches the RAG vector. Runs OFF the hot path (scheduled from
 * confirmMirror) — the user's confirmation tap never waits on an embed.
 *
 * @convex-dev/rag has no in-place importance setter, so "apply the weight"
 * IS a re-ingest (ingestSession re-checks eligibility and re-embeds with the
 * new weight). K is small (≈3 matches), so the cost is bounded per landing.
 */
export const applyMemoryFeedback = internalAction({
  args: {
    matchedKeys: v.array(v.string()),
    feedback: v.union(
      v.literal("confirmed"),
      v.literal("refined"),
      v.literal("gave_up"),
      v.literal("abandoned"),
    ),
  },
  handler: async (ctx, args) => {
    const feedback = args.feedback as MemoryFeedback;
    // Neutral states never move a weight — nothing to schedule.
    if (!isActionableFeedback(feedback)) return;

    for (const key of args.matchedKeys) {
      // Keys are episodic RAG keys, which are sessionIds by construction.
      const sessionId = key as Id<"sessions">;
      // Isolate each memory: a failure on one (adjust or re-embed) must not
      // block feedback from landing on the remaining matched memories.
      try {
        const { changed } = await ctx.runMutation(
          internal.emotionalMetadata.adjustEpisodicImportance,
          { sessionId, feedback },
        );
        // Only pay the re-embed when the weight actually changed (skips no-ops
        // and memories already clamped at a floor/ceiling).
        if (changed) {
          await ctx.runAction(internal.episodicMemory.ingestSession, {
            sessionId,
          });
        }
      } catch (error) {
        console.error(
          `[applyMemoryFeedback] failed for session ${sessionId}:`,
          error,
        );
      }
    }
  },
});

/**
 * Purge one session's episodic entry. Callable from MUTATIONS — this is
 * what keeps wipe parity inside the same transaction path that deletes
 * the session row (dataRetention / dataWipe / accountDeletion).
 * No-op if the profile never had a namespace.
 */
export async function purgeEpisodicEntry(
  ctx: MutationCtx,
  emotionalProfileId: Id<"emotional_profiles">,
  sessionId: Id<"sessions">,
): Promise<void> {
  await purgeEpisodicEntries(ctx, emotionalProfileId, [sessionId]);
}

/** Batch variant — resolves the namespace once per profile. */
export async function purgeEpisodicEntries(
  ctx: MutationCtx,
  emotionalProfileId: Id<"emotional_profiles">,
  sessionIds: Id<"sessions">[],
): Promise<void> {
  if (sessionIds.length === 0) return;
  const namespace = await rag.getNamespace(ctx, {
    namespace: emotionalProfileId,
  });
  if (!namespace) return;
  for (const sessionId of sessionIds) {
    await rag.deleteByKeyAsync(ctx, {
      namespaceId: namespace.namespaceId,
      key: sessionId,
    });
  }
}

// =============================================================
// Backfill — one-shot migration over past sessions.
// Run once: `bunx convex run episodicMemory:backfill '{}'`
// =============================================================

/** One page of session ids for the backfill walk. */
export const listSessionsForBackfill = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("sessions")
      .withIndex("by_date")
      .paginate(args.paginationOpts);
    return {
      ids: page.page.map((s) => s._id),
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});

/**
 * Self-rescheduling backfill of all existing sessions. ingestSession
 * itself decides eligibility (burned / unclassified / crisis /
 * toggle-off), so this walk is a plain sweep.
 */
export const backfill = internalAction({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args) => {
    const page = await ctx.runQuery(
      internal.episodicMemory.listSessionsForBackfill,
      { paginationOpts: { numItems: 25, cursor: args.cursor ?? null } },
    );

    for (const sessionId of page.ids) {
      await ctx.runAction(internal.episodicMemory.ingestSession, {
        sessionId,
      });
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.episodicMemory.backfill, {
        cursor: page.continueCursor,
      });
    }
  },
});
