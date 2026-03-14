import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { requireAuth, requireSessionOwnership } from "./lib/auth";
import {
  entryTypeValidator,
  confirmationStateValidator,
  pathChosenValidator,
} from "./lib/validators";
import { getTimeOfDay, getDayOfWeek } from "./lib/timeOfDay";

const RATE_LIMIT_PER_HOUR = 5;
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
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const now = Date.now();

    // Rate limit: count sessions in the last hour
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", profile._id).gte("createdAt", oneHourAgo)
      )
      .take(RATE_LIMIT_PER_HOUR + 1);

    if (recentSessions.length >= RATE_LIMIT_PER_HOUR) {
      throw new Error("Rate limit exceeded. Please wait before starting a new session.");
    }

    const sessionId = await ctx.db.insert("sessions", {
      emotionalProfileId: profile._id,
      state: "initiated",
      entryType: args.entryType,
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
    rawInputEncrypted: v.string(),
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
      rawInputEncrypted: args.rawInputEncrypted,
      rawInputLength: args.rawInputLength,
      inputDuration: args.inputDuration,
      freezeOccurred: args.freezeOccurred,
      freezeDuration: args.freezeDuration,
      timeOfDay: getTimeOfDay(now),
      dayOfWeek: getDayOfWeek(now),
      updatedAt: now.getTime(),
    });

    // Schedule AI processing (mock for Phase 2, real in Phase 3)
    await ctx.scheduler.runAfter(
      2000, // 2s delay for mock AI
      internal.sessions.deliverMirror,
      {
        sessionId: args.sessionId,
        mirrorText: "I hear you. It sounds like something is weighing on you right now, and that's okay.",
        mirrorModelVersion: "mock-v1",
      }
    );

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
      completedAt: now,
      sessionDuration: now - session.createdAt,
      updatedAt: now,
    });

    // Schedule post-session jobs
    // TODO: Phase 5 — schedule internal.jobs.profileStats.updateAfterSession
    // TODO: Phase 4 — if contributedReflection, schedule internal.jobs.reflectionAnonymizer.anonymize

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

    // TODO: Phase 5 — schedule internal.jobs.profileStats.updateAfterSession

    return null;
  },
});

/**
 * Retry a failed session. → processing, re-schedule AI.
 */
export const retrySession = mutation({
  args: {
    sessionId: v.id("sessions"),
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

    // Re-schedule AI processing (mock for Phase 2)
    await ctx.scheduler.runAfter(
      2000,
      internal.sessions.deliverMirror,
      {
        sessionId: args.sessionId,
        mirrorText: "I hear you. It sounds like something is weighing on you right now, and that's okay.",
        mirrorModelVersion: "mock-v1",
      }
    );

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

    // Check non-terminal states for an active session
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

    for (const state of nonTerminalStates) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_profile_state", (q) =>
          q.eq("emotionalProfileId", profile._id).eq("state", state)
        )
        .first();

      if (session) {
        return session;
      }
    }

    return null;
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

// --- Internal Mutations ---

/**
 * AI delivers the mirror text. processing → mirror_delivered
 */
export const deliverMirror = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    mirrorText: v.string(),
    mirrorModelVersion: v.string(),
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
      updatedAt: Date.now(),
    });
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
 * Mark stale non-terminal sessions as abandoned.
 * Called by cron every 15 minutes.
 */
export const checkAbandoned = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - ABANDON_THRESHOLD_MS;

    const staleStates = [
      "initiated",
      "input_received",
      "processing",
      "mirror_delivered",
      "error",
    ] as const;

    for (const state of staleStates) {
      const staleSessions = await ctx.db
        .query("sessions")
        .withIndex("by_date", (q) => q.lt("createdAt", cutoff))
        .take(50);

      for (const session of staleSessions) {
        if (
          session.state === state &&
          session.updatedAt < cutoff
        ) {
          await ctx.db.patch(session._id, {
            state: "abandoned",
            updatedAt: Date.now(),
          });
        }
      }
    }
  },
});
