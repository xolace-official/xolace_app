import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { requireAuth, requireSessionOwnership } from "./lib/auth";
import {
  entryTypeValidator,
  confirmationStateValidator,
  pathChosenValidator,
  postSessionMoodValidator,
  resourceValidator,
} from "./lib/validators";
import { getTimeOfDay, getDayOfWeek } from "./lib/timeOfDay";
import { rateLimiter } from "./lib/rateLimits";

const ABANDON_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// Terminal states — sessions in these states cannot be transitioned further.
const TERMINAL_STATES = new Set(["completed", "abandoned"]);

// --- Public Mutations ---

/**
 * Create a new session in "initiated" state.
 * Rate limited to 5 sessions per hour per profile.
 */
export const initiate = mutation({
  args: {
    entryType: entryTypeValidator,
    sessionMode: v.optional(v.union(v.literal("day"), v.literal("night"))),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const now = Date.now();

    // Rate limit: 5 sessions/hour per profile (token bucket with burst of 3)
    await rateLimiter.limit(ctx, "sessionInitiate", {
      key: profile._id,
      throws: true,
    });

    const sessionId = await ctx.db.insert("sessions", {
      emotionalProfileId: profile._id,
      state: "initiated",
      entryType: args.entryType,
      kept: true,
      ...(args.sessionMode ? { sessionMode: args.sessionMode } : {}),
      createdAt: now,
      updatedAt: now,
    });

    return sessionId;
  },
});

/**
 * Submit user input. Transitions initiated → processing and schedules AI.
 */
export const submitInput = mutation({
  args: {
    sessionId: v.id("sessions"),
    rawInput: v.string(),
    rawText: v.string(),
    rawInputLength: v.number(),
    inputDuration: v.optional(v.number()),
    freezeOccurred: v.boolean(),
    freezeDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (session.state !== "initiated") {
      throw new Error(`Cannot submit input in state "${session.state}"`);
    }

    const now = new Date();

    await ctx.db.patch(args.sessionId, {
      state: "processing",
      rawInput: args.rawInput,
      rawInputLength: args.rawInputLength,
      inputDuration: args.inputDuration,
      freezeOccurred: args.freezeOccurred,
      freezeDuration: args.freezeDuration,
      timeOfDay: getTimeOfDay(now),
      dayOfWeek: getDayOfWeek(now),
      updatedAt: now.getTime(),
    });

    // Schedule AI processing
    await ctx.scheduler.runAfter(0, internal.ai.process.generateMirror, {
      sessionId: args.sessionId,
      rawText: args.rawText,
    });

    return null;
  },
});

/**
 * User confirms the mirror. → confirmed
 */
export const confirmMirror = mutation({
  args: {
    sessionId: v.id("sessions"),
    confirmationState: confirmationStateValidator,
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (session.state !== "mirror_delivered") {
      throw new Error(`Cannot confirm mirror in state "${session.state}"`);
    }

    await ctx.db.patch(args.sessionId, {
      state: "confirmed",
      confirmationState: args.confirmationState,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * User selects a path (solo/peers/exit). → path_selected
 */
export const selectPath = mutation({
  args: {
    sessionId: v.id("sessions"),
    pathChosen: pathChosenValidator,
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (session.state !== "confirmed") {
      throw new Error(`Cannot select path in state "${session.state}"`);
    }

    await ctx.db.patch(args.sessionId, {
      state: "path_selected",
      pathChosen: args.pathChosen,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Start a path (e.g. begin exercise). → path_in_progress
 */
export const startPath = mutation({
  args: {
    sessionId: v.id("sessions"),
    exerciseId: v.optional(v.id("exercises")),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (session.state !== "path_selected") {
      throw new Error(`Cannot start path in state "${session.state}"`);
    }

    await ctx.db.patch(args.sessionId, {
      state: "path_in_progress",
      exerciseId: args.exerciseId,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Complete a path. → completed. Schedules post-session jobs.
 */
export const completePath = mutation({
  args: {
    sessionId: v.id("sessions"),
    pathCompleted: v.boolean(),
    contributedReflection: v.optional(v.boolean()),
    postSessionMood: v.optional(postSessionMoodValidator),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (session.state !== "path_in_progress" && session.state !== "path_selected") {
      throw new Error(`Cannot complete path in state "${session.state}"`);
    }

    const now = Date.now();

    await ctx.db.patch(args.sessionId, {
      state: "completed",
      pathCompleted: args.pathCompleted,
      contributedReflection: args.contributedReflection,
      ...(args.postSessionMood ? { postSessionMood: args.postSessionMood } : {}),
      completedAt: now,
      sessionDuration: now - session.createdAt,
      updatedAt: now,
    });

    // Schedule post-session jobs
    await ctx.scheduler.runAfter(0, internal.jobs.profileStats.updateAfterSession, {
      emotionalProfileId: session.emotionalProfileId,
      sessionId: args.sessionId,
    });
    if (args.contributedReflection) {
      await ctx.scheduler.runAfter(0, internal.jobs.reflectionAnonymizer.anonymize, {
        sessionId: args.sessionId,
      });
    }

    return null;
  },
});

/**
 * Direct complete for "exit" path from confirmed state. → completed
 */
export const completeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (session.state !== "confirmed") {
      throw new Error(`Cannot complete session in state "${session.state}"`);
    }

    const now = Date.now();

    await ctx.db.patch(args.sessionId, {
      state: "completed",
      pathChosen: "exit",
      pathCompleted: true,
      completedAt: now,
      sessionDuration: now - session.createdAt,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.jobs.profileStats.updateAfterSession, {
      emotionalProfileId: session.emotionalProfileId,
      sessionId: args.sessionId,
    });

    return null;
  },
});

/**
 * Retry a failed session. → processing, re-schedule AI.
 */
export const retrySession = mutation({
  args: {
    sessionId: v.id("sessions"),
    rawText: v.string(),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (session.state !== "error") {
      throw new Error(`Cannot retry session in state "${session.state}"`);
    }

    await ctx.db.patch(args.sessionId, {
      state: "processing",
      errorMessage: undefined,
      updatedAt: Date.now(),
    });

    // Re-schedule AI processing
    await ctx.scheduler.runAfter(0, internal.ai.process.generateMirror, {
      sessionId: args.sessionId,
      rawText: args.rawText,
    });

    return null;
  },
});

/**
 * Abandon a session (user left).
 */
export const abandon = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (TERMINAL_STATES.has(session.state)) {
      throw new Error(`Cannot abandon session in terminal state "${session.state}"`);
    }

    await ctx.db.patch(args.sessionId, {
      state: "abandoned",
      updatedAt: Date.now(),
    });

    return null;
  },
});

// --- Public Queries ---

/**
 * Find a resumable (non-terminal) session for the current profile.
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    // Query each non-terminal state via the by_profile_state index.
    // 8 bounded index lookups (each returns at most 1 doc), then pick
    // the most recent. O(1) per state regardless of total sessions.
    const nonTerminalStates = [
      "initiated",
      "input_received",
      "processing",
      "mirror_delivered",
      "confirmed",
      "path_selected",
      "path_in_progress",
      "error",
    ] as const;

    let latest = null;
    for (const state of nonTerminalStates) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_profile_state", (q) =>
          q.eq("emotionalProfileId", profile._id).eq("state", state)
        )
        .order("desc")
        .first();

      if (session && (!latest || session._creationTime > latest._creationTime)) {
        latest = session;
      }
    }

    return latest;
  },
});

/**
 * Get a single session by ID (with ownership check).
 */
export const getById = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);
    return session;
  },
});

/**
 * Paginated timeline of sessions for the current profile.
 * Client uses usePaginatedQuery from convex/react.
 */
export const listByProfile = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    return await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Paginated timeline entries enriched with emotional metadata.
 * Only returns sessions that have a mirror (meaningful to display).
 */
export const listForTimeline = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const result = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedPage = await Promise.all(
      result.page
        .filter((s) => s.mirrorText != null)
        .map(async (session) => {
          const metadata = await ctx.db
            .query("emotional_metadata")
            .withIndex("by_session", (q) => q.eq("sessionId", session._id))
            .unique();

          return {
            _id: session._id,
            mirrorText: session.mirrorText!,
            confirmationState: session.confirmationState ?? null,
            pathChosen: session.pathChosen ?? null,
            primaryEmotion: metadata?.primaryEmotion ?? null,
            granularLabel: metadata?.granularLabel ?? null,
            createdAt: session.createdAt,
          };
        })
    );

    return { ...result, page: enrichedPage };
  },
});

/**
 * Combined session + emotional metadata for the details screen.
 * Single subscription, single auth check.
 */
export const getSessionDetails = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    return {
      ...session,
      primaryEmotion: metadata?.primaryEmotion ?? null,
      granularLabel: metadata?.granularLabel ?? null,
      intensity: metadata?.intensity ?? null,
      thematicTags: metadata?.thematicTags ?? null,
    };
  },
});

// --- Internal Mutations ---

/**
 * AI delivers the mirror text. processing → mirror_delivered
 */
export const deliverMirror = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    mirrorText: v.string(),
    mirrorModelVersion: v.string(),
    escalationTriggered: v.optional(v.boolean()),
    escalationResources: v.optional(v.array(resourceValidator)),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.state !== "processing") {
      // Session may have been abandoned while AI was working
      return;
    }

    await ctx.db.patch(args.sessionId, {
      state: "mirror_delivered",
      mirrorText: args.mirrorText,
      mirrorModelVersion: args.mirrorModelVersion,
      ...(args.escalationTriggered ? { escalationTriggered: true } : {}),
      ...(args.escalationResources ? { escalationResources: args.escalationResources } : {}),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal read for TTS idempotency check — returns only the audio storage ID field.
 */
export const getMirrorAudioStorageId = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    return session?.mirrorAudioStorageId ?? null;
  },
});

/**
 * TTS action stores the generated audio storage ID on the session.
 */
export const storeMirrorAudio = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    await ctx.db.patch(args.sessionId, {
      mirrorAudioStorageId: args.storageId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Clears the mirror audio storage ID from the session (called before regenerating TTS on clarification).
 */
export const clearMirrorAudio = internalMutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    await ctx.db.patch(args.sessionId, {
      mirrorAudioStorageId: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Returns a signed URL for the session's mirror audio, or null if not yet ready.
 */
export const getMirrorAudioUrl = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);
    if (!session.mirrorAudioStorageId) return null;
    return ctx.storage.getUrl(session.mirrorAudioStorageId);
  },
});

/**
 * AI processing failed. processing → error
 */
export const failSession = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    if (session.state !== "processing") return;

    await ctx.db.patch(args.sessionId, {
      state: "error",
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Write filled slot values onto a session.
 * Called from the slot-fill action after Haiku resolves user_phrase.
 */
export const writeExerciseSlots = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    slots: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    const existing = session.exerciseSlots ?? {};
    await ctx.db.patch(args.sessionId, {
      exerciseSlots: { ...existing, ...args.slots },
    });
  },
});

/**
 * Store the AI-distilled reflection text on a session.
 * Called speculatively after mirror delivery — the distillation
 * runs in the background so it's ready by contribution time.
 */
export const storeDistilledText = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    distilledText: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    // Only store if session hasn't been abandoned/completed already
    if (session.state === "completed" || session.state === "abandoned") return;

    await ctx.db.patch(args.sessionId, {
      distilledText: args.distilledText,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Read the `kept` flag for a session.
 * Used by the distiller action (Node.js runtime) which cannot call ctx.db directly.
 */
export const getSessionKept = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    return session?.kept ?? null;
  },
});

/**
 * Mark stale non-terminal sessions as abandoned.
 * Called by cron every 15 minutes.
 */
export const checkAbandoned = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - ABANDON_THRESHOLD_MS;

    const staleStateSet = new Set([
      "initiated",
      "input_received",
      "processing",
      "mirror_delivered",
      "error",
    ]);

    const staleSessions = await ctx.db
      .query("sessions")
      .withIndex("by_date", (q) => q.lt("createdAt", cutoff))
      .take(50);

    for (const session of staleSessions) {
      if (staleStateSet.has(session.state) && session.updatedAt < cutoff) {
        await ctx.db.patch(session._id, {
          state: "abandoned",
          updatedAt: Date.now(),
        });
      }
    }
  },
});
