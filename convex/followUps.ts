import { v } from "convex/values";
import {
  WorkflowManager,
  vWorkflowId,
  vResultValidator,
  type WorkflowCtx,
} from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";
import {
  followUpCadence,
  followUpTier,
  shouldEmitReturn,
  shouldSupersede,
} from "./lib/followUpCadence";
import {
  getAnthropicClient,
  extractTextFromResponse,
} from "./ai/providers/anthropic";
import {
  buildFollowUpCardPrompt,
  fallbackFollowUpCard,
} from "./ai/prompts/followUpCardWriter";

const CARD_MODEL = "claude-haiku-4-5-20251001";
const MAX_CARD_CHARS = 200;

export const workflow = new WorkflowManager(components.workflow);

// Card responses the client may send.
const userResponseValidator = v.union(
  v.literal("lighter"),
  v.literal("still_here"),
  v.literal("heavier"),
  v.literal("processed"),
  v.literal("vent"),
  v.literal("dismissed"),
);

// Active = a card whose lifecycle is still owned by a live workflow.
const ACTIVE_STATUSES = new Set(["pending", "ready", "shown"]);

// =============================================================
// The durable follow-up workflow
// =============================================================
//
// Sleep durations are passed as args (never in-body constants) so cadence
// tuning never reshapes the function — deterministic journal replay.
export const followUpWorkflow = workflow
  .define({
    args: {
      sessionId: v.id("sessions"),
      emotionalProfileId: v.id("emotional_profiles"),
      stage1Ms: v.number(),
      stage2Ms: v.number(),
      expiryMs: v.number(),
    },
  })
  .handler(async (step, args): Promise<void> => {
    const workflowId = step.workflowId;

    // Stage 1: first check window — return early OR the first delay elapses.
    if (await raceReturnOrSleep(step, args.stage1Ms)) {
      await step.runMutation(internal.followUps.markCardReady, { workflowId });
      return;
    }
    await step.runMutation(internal.followUps.sendFollowUpNudge, { workflowId });

    // Stage 2: second window — return OR the second delay elapses.
    if (await raceReturnOrSleep(step, args.stage2Ms)) {
      await step.runMutation(internal.followUps.markCardReady, { workflowId });
      return;
    }
    await step.runMutation(internal.followUps.sendFollowUpNudge, { workflowId });

    // Expiry: no return after both nudges.
    await step.sleep(args.expiryMs, { name: "expiry" });
    await step.runMutation(internal.followUps.markCardExpired, { workflowId });
  });

/**
 * Wait for a "userReturned" event OR a timeout, whichever fires first.
 * Returns true if the user returned, false if the timer elapsed.
 */
async function raceReturnOrSleep(
  step: WorkflowCtx,
  ms: number,
): Promise<boolean> {
  return Promise.race([
    step.awaitEvent({ name: "userReturned" }).then(() => true),
    step.sleep(ms, { name: "stage" }).then(() => false),
  ]);
}

// =============================================================
// Workflow start (called from a node action that wrote cardText)
// =============================================================

/**
 * Pre-flight context for the card writer + start gate. Returns null when the
 * session should NOT spawn a follow-up (already has one, or doesn't qualify) —
 * saving a wasted Haiku call. The authoritative idempotency + supersede check
 * is re-done atomically in `createAndStart`.
 */
export const getStartContext = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (session.followUpWorkflowId) return null; // already started (idempotent)
    if (session.requiresFollowUp !== true) return null;

    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    const gaveUp = session.confirmationState === "gave_up";
    const escalationDerived = session.escalationTriggered === true;

    // Concrete (non-optional) shape — every field present (null when absent) so
    // it matches the createAndStart `signals` validator exactly.
    const signals = {
      safeguardLevel: session.safeguardLevel ?? null,
      intensity: metadata?.intensity ?? null,
      primaryEmotion: metadata?.primaryEmotion ?? null,
      granularLabel: metadata?.granularLabel ?? null,
      confirmationState: session.confirmationState ?? null,
    };

    return {
      emotionalProfileId: session.emotionalProfileId,
      escalationDerived,
      signals,
      cardCtx: {
        // gave_up sessions have no landed mirror — write mirror-free.
        mirrorText: gaveUp ? null : (session.mirrorText ?? null),
        followUpReason: metadata?.followUpReason ?? null,
        primaryEmotion: metadata?.primaryEmotion ?? null,
        granularLabel: metadata?.granularLabel ?? null,
        gaveUp,
      },
    };
  },
});

/**
 * Generate the check-in card text (Haiku) and start the durable workflow.
 * Scheduled off the critical path when a session completes (or an escalation
 * session is abandoned). The card row + workflow ALWAYS start — even on a Haiku
 * outage (FALLBACK_FOLLOWUP_CARD) — so safety-relevant follow-ups are never
 * silently dropped. The Anthropic SDK is fetch-based, so this needs no node.
 */
export const startFollowUpWorkflow = internalAction({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const start = await ctx.runQuery(internal.followUps.getStartContext, {
      sessionId: args.sessionId,
    });
    if (!start) return; // already started, or session no longer qualifies

    const tier = followUpTier(start.signals);

    let cardText: string;
    try {
      const anthropic = getAnthropicClient();
      const prompt = buildFollowUpCardPrompt({
        tier,
        mirrorText: start.cardCtx.mirrorText,
        followUpReason: start.cardCtx.followUpReason,
        primaryEmotion: start.cardCtx.primaryEmotion,
        granularLabel: start.cardCtx.granularLabel,
        gaveUp: start.cardCtx.gaveUp,
      });

      const response = await anthropic.messages.create({
        model: CARD_MODEL,
        max_tokens: 120,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      });

      const raw = extractTextFromResponse(response)
        .trim()
        .replace(/^["']|["']$/g, "");
      cardText =
        raw && raw.length <= MAX_CARD_CHARS ? raw : fallbackFollowUpCard(tier);
    } catch (err) {
      console.error("[followUpCard] Haiku failed; using fallback card", {
        message: err instanceof Error ? err.message : String(err),
        sessionId: args.sessionId,
      });
      cardText = fallbackFollowUpCard(tier);
    }

    await ctx.runMutation(internal.followUps.createAndStart, {
      sessionId: args.sessionId,
      emotionalProfileId: start.emotionalProfileId,
      cardText,
      escalationDerived: start.escalationDerived,
      signals: start.signals,
    });
  },
});

/**
 * Atomically: re-check idempotency + weight-aware supersede, start the
 * workflow, create the card row, and pin the workflowId on the session.
 */
export const createAndStart = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    emotionalProfileId: v.id("emotional_profiles"),
    cardText: v.string(),
    escalationDerived: v.boolean(),
    // Pass the pure signals so cadence/tier is computed from one source here.
    signals: v.object({
      safeguardLevel: v.union(
        v.literal("none"),
        v.literal("gentle"),
        v.literal("elevated"),
        v.literal("crisis"),
        v.null(),
      ),
      intensity: v.union(v.number(), v.null()),
      primaryEmotion: v.union(v.string(), v.null()),
      granularLabel: v.union(v.string(), v.null()),
      confirmationState: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    // Idempotency: session may already have a workflow (double completion).
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.followUpWorkflowId) return null;

    const cadence = followUpCadence(args.signals);
    const newTier = cadence.tier;

    // One-active-per-profile + weight-aware supersede.
    const active = await getActiveCardForProfile(ctx, args.emotionalProfileId);
    if (active) {
      if (!shouldSupersede(newTier, active.tier)) {
        // Lower-weight session — skip entirely (do not start).
        return null;
      }
      // Equal-or-higher weight — cancel the old workflow and mark superseded.
      await workflow.cancel(ctx, active.workflowId);
      await ctx.db.patch(active._id, { status: "superseded" });
    }

    const workflowId = await workflow.start(
      ctx,
      internal.followUps.followUpWorkflow,
      {
        sessionId: args.sessionId,
        emotionalProfileId: args.emotionalProfileId,
        stage1Ms: cadence.stage1Ms,
        stage2Ms: cadence.stage2Ms,
        expiryMs: cadence.expiryMs,
      },
      { onComplete: internal.followUps.onFollowUpComplete, context: {} },
    );

    await ctx.db.insert("follow_up_cards", {
      emotionalProfileId: args.emotionalProfileId,
      sessionId: args.sessionId,
      workflowId,
      tier: newTier,
      cardText: args.cardText,
      escalationDerived: args.escalationDerived,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.sessionId, { followUpWorkflowId: workflowId });
    return null;
  },
});

// =============================================================
// Workflow-driven card transitions (all idempotent on status === "pending")
// =============================================================

export const markCardReady = internalMutation({
  args: { workflowId: vWorkflowId },
  handler: async (ctx, args) => {
    const card = await getCardByWorkflow(ctx, args.workflowId);
    // Only a still-pending card flips to ready — never downgrade ready/shown.
    if (!card || card.status !== "pending") return null;
    await ctx.db.patch(card._id, { status: "ready" });
    return null;
  },
});

export const markCardExpired = internalMutation({
  args: { workflowId: vWorkflowId },
  handler: async (ctx, args) => {
    const card = await getCardByWorkflow(ctx, args.workflowId);
    // A ready card is NEVER downgraded to expired by the timer.
    if (!card || card.status !== "pending") return null;
    await ctx.db.patch(card._id, { status: "expired" });
    return null;
  },
});

/**
 * Deliver a follow-up push. Follow-up-only gating (enabled flag only — no
 * per-type toggle, no quiet window, by deliberate early-stage design). Acute
 * tier sends a recency-anchored, wound-free body; the cardText is in-app only.
 */
export const sendFollowUpNudge = internalMutation({
  args: { workflowId: vWorkflowId },
  handler: async (ctx, args) => {
    const card = await getCardByWorkflow(ctx, args.workflowId);
    if (!card || card.status !== "pending") return null;

    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", card.emotionalProfileId),
      )
      .unique();
    if (!prefs?.notifications.enabled) return null; // enabled-only gating

    const body =
      card.tier === "acute"
        ? "Just checking in on what you worked through a little while ago. We're here."
        : card.cardText;

    await ctx.scheduler.runAfter(0, internal.notifications.schedule, {
      emotionalProfileId: card.emotionalProfileId,
      type: "follow_up",
      content: body,
      triggerReason: `follow_up_${card.tier}`,
      followUpTier: card.tier,
      scheduledFor: Date.now(),
    });
    return null;
  },
});

/** Component onComplete hook — purge the workflow's journal tables. */
export const onFollowUpComplete = internalMutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.any(),
  },
  handler: async (ctx, args) => {
    await workflow.cleanup(ctx, args.workflowId);
    return null;
  },
});

// =============================================================
// Return detection (client → app open)
// =============================================================

/**
 * Called on app open when a pending follow-up exists. Emits `userReturned`
 * to the owning workflow, guarded so it can only resolve after the gap (never
 * in the same sitting) and only for a still-pending card (no re-send after
 * ready). The guard lives here, not in the client, for robustness.
 */
export const markReturn = mutation({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const card = await getActiveCardForProfile(ctx, profile._id);
    if (!card) return null;

    if (
      shouldEmitReturn({
        cardStatus: card.status,
        cardCreatedAt: card.createdAt,
        now: Date.now(),
      })
    ) {
      await workflow.sendEvent(ctx, {
        workflowId: card.workflowId,
        name: "userReturned",
      });
    }
    return null;
  },
});

// =============================================================
// Client read + write surface (the check-in sheet + profile section)
// =============================================================

/** The card to surface on reopen, if any (ready first, then shown). */
export const getReadyCard = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const ready = await ctx.db
      .query("follow_up_cards")
      .withIndex("by_profile_status", (q) =>
        q.eq("emotionalProfileId", profile._id).eq("status", "ready"),
      )
      .order("desc")
      .first();

    console.log("ready ", ready)
    if (ready) return ready;
    return await ctx.db
      .query("follow_up_cards")
      .withIndex("by_profile_status", (q) =>
        q.eq("emotionalProfileId", profile._id).eq("status", "shown"),
      )
      .order("desc")
      .first();
  },
});

/** Mark a ready card as shown when the sheet mounts (idempotent). */
export const markShown = mutation({
  args: { cardId: v.id("follow_up_cards") },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const card = await ctx.db.get(args.cardId);
    if (!card || card.emotionalProfileId !== profile._id) return null;
    if (card.status !== "ready") return null; // idempotent
    await ctx.db.patch(args.cardId, { status: "shown", shownAt: Date.now() });
    return null;
  },
});

/** Resolve a card with the user's response (chip tap or backdrop dismiss). */
export const resolveCard = mutation({
  args: { cardId: v.id("follow_up_cards"), response: userResponseValidator },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);
    const card = await ctx.db.get(args.cardId);
    if (!card || card.emotionalProfileId !== profile._id) return null;
    if (card.status === "resolved") return null; // idempotent
    await ctx.db.patch(args.cardId, {
      status: "resolved",
      userResponse: args.response,
      resolvedAt: Date.now(),
    });
    return null;
  },
});

/** Profile Follow-Ups section — full history, newest first. */
export const listForProfile = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    return await ctx.db
      .query("follow_up_cards")
      .withIndex("by_profile_created", (q) =>
        q.eq("emotionalProfileId", profile._id),
      )
      .order("desc")
      .take(50);
  },
});

// =============================================================
// Privacy cleanup (called by dataWipe + accountDeletion)
// =============================================================

/**
 * Cancel any active workflow and purge all follow-up cards for a profile.
 * Idempotent; safe to call repeatedly. Returns the number of cards purged.
 */
export const purgeForProfile = internalMutation({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("follow_up_cards")
      .withIndex("by_profile_created", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId),
      )
      .take(200);

    for (const card of cards) {
      if (ACTIVE_STATUSES.has(card.status)) {
        // Cancel the live workflow so it stops nudging a deleted user.
        try {
          await workflow.cancel(ctx, card.workflowId);
        } catch {
          // Already terminal — nothing to cancel.
        }
      }
      await ctx.db.delete(card._id);
    }
    return cards.length;
  },
});

// =============================================================
// Internal helpers (shared lookups)
// =============================================================

async function getCardByWorkflow(
  ctx: QueryCtx,
  workflowId: Doc<"follow_up_cards">["workflowId"],
): Promise<Doc<"follow_up_cards"> | null> {
  return await ctx.db
    .query("follow_up_cards")
    .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
    .unique();
}

/** The single active (pending|ready|shown) card for a profile, if any. */
async function getActiveCardForProfile(
  ctx: QueryCtx,
  emotionalProfileId: Id<"emotional_profiles">,
): Promise<Doc<"follow_up_cards"> | null> {
  for (const status of ["pending", "ready", "shown"] as const) {
    const card = await ctx.db
      .query("follow_up_cards")
      .withIndex("by_profile_status", (q) =>
        q.eq("emotionalProfileId", emotionalProfileId).eq("status", status),
      )
      .order("desc")
      .first();
    if (card) return card;
  }
  return null;
}
