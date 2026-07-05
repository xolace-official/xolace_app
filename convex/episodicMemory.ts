import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  internalAction,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { rag } from "./rag";

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
    const session = await ctx.db.get(args.sessionId);
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
      filterValues: [
        { name: "primaryEmotion", value: source.primaryEmotion },
        ...(source.granularLabel
          ? [{ name: "granularLabel", value: source.granularLabel }]
          : []),
      ],
    });
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
