import { ConvexError, v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import {
  conversationOrigin,
  type ConversationOrigin,
  meetsRatingFloor,
  rankSuggestionCandidates,
  SUGGESTION_ORIGIN_WINDOW_MS,
} from "./lib/xolacerSuggestion";
import { posthog } from "./posthog";
import {
  createXolacerChannel,
  deleteStreamUser,
  getStreamApiKey,
  mintUserToken,
  upsertStreamUsers,
} from "./integrations/stream";
import { MAX_SPECIALTIES, specialtyValidator } from "./lib/specialties";

const statusValidator = v.union(
  v.literal("requested"),
  v.literal("open"),
  v.literal("resting"),
  v.literal("closed"),
);
const closedReasonValidator = v.optional(
  v.union(
    v.literal("declined"),
    v.literal("expired"),
    v.literal("blocked"),
    v.literal("xolacer_left"),
  ),
);
const originValidator = v.optional(
  v.union(v.literal("suggestion"), v.literal("direct")),
);
const conversationRowValidator = v.object({
  id: v.id("xolacer_conversations"),
  role: v.union(v.literal("user"), v.literal("xolacer")),
  status: statusValidator,
  closedReason: closedReasonValidator,
  streamChannelId: v.optional(v.string()),
  lastMessageAt: v.optional(v.number()),
  requestedAt: v.number(),
  // Stable identity for the xolacer side of the thread — the roster matches
  // on this, never on display name (names repeat and can change).
  xolacerProfileId: v.id("emotional_profiles"),
  counterpartName: v.string(),
  counterpartPhotoUrl: v.optional(v.string()),
  // Xolacer-side only — the seeker never learns how their own request was
  // stamped. Absent on rows predating the feature, which read as direct.
  origin: originValidator,
});

// Volume cap counts OPEN conversations only — resting/closed free the slot.
export const MAX_OPEN_CONVERSATIONS = 8;
/**
 * Outbound requests a seeker may have awaiting an answer at once. Only
 * "requested" rows count — once a xolacer accepts or declines, the slot is
 * free again. Without this a user can blanket every xolacer in the directory.
 */
export const MAX_PENDING_REQUESTS = 2;
const REQUEST_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const RESTING_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Below this, no average is shown anywhere — one bad night shouldn't read as
 * a xolacer's score, and a 5.0 from a single rating is worse than no number
 * at all. Enforced server-side so the client never receives a hideable value.
 */
const MIN_RATINGS_TO_DISPLAY = 5;

/**
 * Ceiling on how many specialty-declaring xolacers sessionSuggestion will pay
 * per-candidate reads for. A safety valve, not a tuning knob: at any plausible
 * roster size the specialty filter yields far fewer than this, so it should
 * never bind. If it ever does, ranking sees a subset and least-loaded stops
 * being exact — which is the signal to index specialties properly.
 */
const MAX_SUGGESTION_CANDIDATES = 200;

/** Public rating shape: the average exists only past the display threshold. */
function publicRating(profile: Doc<"xolacer_profiles">) {
  const count = profile.ratingCount ?? 0;
  return {
    rating:
      count >= MIN_RATINGS_TO_DISPLAY
        ? Math.round(((profile.ratingSum ?? 0) / count) * 10) / 10
        : undefined,
    ratingCount: count,
  };
}

// Global kill-switch (env-var gate, same pattern as devTools). The feature
// ships dark until the ambassador-consent + DPA review clears.
function chatEnabled() {
  return process.env.XOLACER_CHAT_ENABLED === "true";
}

/**
 * Xolacer-side counterparts are anonymous users — no public identity exists
 * for them by design. A stable pseudonym derived from the profile id keeps
 * multiple conversations distinguishable without leaking anything.
 */
function pseudonym(profileId: string) {
  return `Camper ${profileId.slice(-4).toUpperCase()}`;
}

/**
 * The seeker's chat picture — their chosen catalog avatar. `avatars.url` is
 * already a denormalized public storage URL, so Stream takes it as-is.
 * Curated illustrations only, never a photo, so it leaks nothing the
 * pseudonym doesn't.
 *
 * Two reads per row in myConversations (up to 100 conversations) is the only
 * cost worth naming; if that ever bites, denormalize avatarUrl onto
 * xolacer_conversations at request time. Not yet.
 */
async function seekerImage(ctx: QueryCtx, profileId: Id<"emotional_profiles">) {
  const prefs = await ctx.db
    .query("preferences")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profileId))
    .unique();
  const avatar = await ctx.db
    .query("avatars")
    .withIndex("by_key", (q) => q.eq("key", prefs?.avatarId ?? "default"))
    .unique();
  return avatar?.url;
}

async function countOpen(ctx: QueryCtx, xolacerProfileId: Id<"emotional_profiles">) {
  const open = await ctx.db
    .query("xolacer_conversations")
    .withIndex("by_xolacer_and_status", (q) =>
      q.eq("xolacerProfileId", xolacerProfileId).eq("status", "open"),
    )
    .take(MAX_OPEN_CONVERSATIONS);
  return open.length;
}

/** Outbound requests a seeker has awaiting an answer. Stops at the cap. */
async function countPendingRequests(
  ctx: QueryCtx,
  userProfileId: Id<"emotional_profiles">,
) {
  const pending = await ctx.db
    .query("xolacer_conversations")
    .withIndex("by_user_and_status", (q) =>
      q.eq("userProfileId", userProfileId).eq("status", "requested"),
    )
    .take(MAX_PENDING_REQUESTS);
  return pending.length;
}

/**
 * Guard for any transition that puts a row into "requested". Distinct error
 * code so the client can say "waiting on 2 already" instead of blaming the
 * xolacer's availability.
 */
async function requirePendingRequestSlot(
  ctx: QueryCtx,
  userProfileId: Id<"emotional_profiles">,
) {
  if ((await countPendingRequests(ctx, userProfileId)) >= MAX_PENDING_REQUESTS) {
    throw new ConvexError({
      code: "pending_request_limit",
      max: MAX_PENDING_REQUESTS,
    });
  }
}

function xolacerAvailable(
  profile: Doc<"xolacer_profiles"> | null,
  openCount: number,
): profile is Doc<"xolacer_profiles"> {
  return Boolean(
    profile && profile.complete && profile.active && openCount < MAX_OPEN_CONVERSATIONS,
  );
}

async function getXolacerProfileByProfileId(
  ctx: QueryCtx,
  emotionalProfileId: Id<"emotional_profiles">,
) {
  return await ctx.db
    .query("xolacer_profiles")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", emotionalProfileId))
    .unique();
}

async function findRating(
  ctx: QueryCtx,
  conversationId: Id<"xolacer_conversations">,
) {
  return await ctx.db
    .query("conversation_ratings")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
    .unique();
}

/**
 * The abuse guard: `lastMessageAt` is stamped once on accept and again by
 * `touchConversation` on every send, so a later timestamp is proof that at
 * least one real message followed the handshake. Without it, a request that
 * was accepted and then ignored could still be rated.
 */
function hasRealExchange(conversation: Doc<"xolacer_conversations">) {
  return Boolean(
    conversation.acceptedAt &&
      conversation.lastMessageAt &&
      conversation.lastMessageAt > conversation.acceptedAt,
  );
}

async function requireConversationParticipant(
  ctx: QueryCtx,
  conversationId: Id<"xolacer_conversations">,
) {
  const { user, profile } = await requireAuth(ctx);
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  const role =
    conversation.userProfileId === profile._id
      ? ("user" as const)
      : conversation.xolacerProfileId === profile._id
        ? ("xolacer" as const)
        : null;
  if (!role) throw new Error("Conversation does not belong to this user");
  return { user, profile, conversation, role };
}

// ============================================================
// Status / gating
// ============================================================

/** Feature + role status for the Connect tab. Null-safe when disabled. */
export const status = query({
  args: {},
  returns: v.union(
    v.object({ enabled: v.literal(false) }),
    v.object({
      enabled: v.literal(true),
      isXolacer: v.boolean(),
      xolacerProfileComplete: v.boolean(),
      xolacerActive: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    if (!chatEnabled()) return { enabled: false as const };
    const { user, profile } = await requireAuth(ctx);
    const xolacerProfile = user.isXolacer
      ? await getXolacerProfileByProfileId(ctx, profile._id)
      : null;
    return {
      enabled: true as const,
      isXolacer: Boolean(user.isXolacer),
      xolacerProfileComplete: Boolean(xolacerProfile?.complete),
      xolacerActive: Boolean(xolacerProfile?.active),
    };
  },
});

// ============================================================
// Directory
// ============================================================

export const directory = query({
  args: {},
  returns: v.array(
    v.object({
      xolacerProfileId: v.id("emotional_profiles"),
      displayName: v.string(),
      bio: v.string(),
      photoUrl: v.optional(v.string()),
      specialties: v.array(specialtyValidator),
      rating: v.optional(v.number()),
      ratingCount: v.number(),
      atCapacity: v.boolean(),
      xolacerSince: v.number(),
    }),
  ),
  handler: async (ctx) => {
    if (!chatEnabled()) return [];
    const { profile } = await requireAuth(ctx);

    const xolacers = await ctx.db
      .query("xolacer_profiles")
      .withIndex("by_complete_and_active", (q) =>
        q.eq("complete", true).eq("active", true),
      )
      .take(50);

    const rows = [];
    for (const xolacer of xolacers) {
      // A xolacer browsing the roster shouldn't see themselves.
      if (xolacer.emotionalProfileId === profile._id) continue;
      const openCount = await countOpen(ctx, xolacer.emotionalProfileId);
      rows.push({
        xolacerProfileId: xolacer.emotionalProfileId,
        displayName: xolacer.displayName ?? "",
        bio: xolacer.bio ?? "",
        photoUrl: xolacer.photoUrl,
        specialties: xolacer.specialties ?? [],
        ...publicRating(xolacer),
        atCapacity: openCount >= MAX_OPEN_CONVERSATIONS,
        xolacerSince: xolacer.createdAt,
      });
    }
    return rows;
  },
});

/** Public profile + my relationship to this xolacer (drives the CTA). */
export const xolacerProfile = query({
  args: { xolacerProfileId: v.id("emotional_profiles") },
  returns: v.union(
    v.null(),
    v.object({
      xolacerProfileId: v.id("emotional_profiles"),
      displayName: v.string(),
      bio: v.string(),
      photoUrl: v.optional(v.string()),
      specialties: v.array(specialtyValidator),
      rating: v.optional(v.number()),
      ratingCount: v.number(),
      xolacerSince: v.number(),
      available: v.boolean(),
      /** Viewing your own profile — the request CTA is replaced, not disabled. */
      isSelf: v.boolean(),
      conversation: v.union(
        v.null(),
        v.object({
          id: v.id("xolacer_conversations"),
          status: statusValidator,
          closedReason: closedReasonValidator,
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    if (!chatEnabled()) return null;
    const { profile } = await requireAuth(ctx);

    const xolacer = await getXolacerProfileByProfileId(ctx, args.xolacerProfileId);
    if (!xolacer || !xolacer.complete) return null;

    const openCount = await countOpen(ctx, args.xolacerProfileId);
    const conversation = await ctx.db
      .query("xolacer_conversations")
      .withIndex("by_user_and_xolacer", (q) =>
        q.eq("userProfileId", profile._id).eq("xolacerProfileId", args.xolacerProfileId),
      )
      .unique();

    return {
      xolacerProfileId: args.xolacerProfileId,
      displayName: xolacer.displayName ?? "",
      bio: xolacer.bio ?? "",
      photoUrl: xolacer.photoUrl,
      specialties: xolacer.specialties ?? [],
      ...publicRating(xolacer),
      xolacerSince: xolacer.createdAt,
      available: xolacerAvailable(xolacer, openCount),
      isSelf: profile._id === args.xolacerProfileId,
      conversation: conversation
        ? {
            id: conversation._id,
            status: conversation.status,
            closedReason: conversation.closedReason,
          }
        : null,
    };
  },
});

/**
 * The one xolacer this session would offer, or null — null being the correct
 * and common answer.
 *
 * The person is chosen at read time and never stored. That is load-bearing for
 * privacy, not an optimization: no record linking a session to a specific
 * xolacer exists anywhere, which is what keeps the profile screen's promise
 * that a chat is never linked to a user's reflections literally true. It also
 * means availability is always current, so there is no stale suggestion to
 * expire.
 */
export const sessionSuggestion = query({
  args: { sessionId: v.id("sessions") },
  returns: v.union(
    v.null(),
    v.object({
      xolacerProfileId: v.id("emotional_profiles"),
      displayName: v.string(),
      photoUrl: v.optional(v.string()),
      specialties: v.array(specialtyValidator),
      // The one that matched. The card says what they listen to with it, and
      // carries it to the profile so the escape hatch there stays on-thread.
      specialty: specialtyValidator,
      rating: v.optional(v.number()),
      ratingCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!chatEnabled()) return null;

    // Null, never throw, when the session isn't this user's or is gone. The
    // caller is the session-end close phase, which reads `sessionId` from a
    // route param and renders inside no error boundary — a throw there takes
    // the whole screen down. Two ordinary paths reach it: a session the
    // retention sweep has since deleted, and a stale deep link. Returning null
    // degrades to exactly the pre-feature behaviour (the Bridge card), which
    // is what chooseCloseOffer already does with null.
    // Still an ownership check, not a relaxation: a session that fails it
    // yields no suggestion at all.
    const { profile } = await requireAuth(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.emotionalProfileId !== profile._id) return null;

    // Decided once by the pipeline (lib/xolacerSuggestion); absent is the
    // common case, and every gate that produced it already ran back then.
    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    const specialty = metadata?.suggestedSpecialty;
    if (!specialty) return null;

    // The stored verdict only ever saw the first input. Refinement turns are
    // deliberately not re-classified (ai/clarify.ts: "Skips moderation +
    // classification"), so anything the user added afterwards has been through
    // no safeguard and no classifier — and the specialty above predates it.
    // Suggesting on it would route someone to a volunteer on the strength of a
    // verdict that never read what they last said.
    // Bounded by design: a session has at most MAX_TURNS (2) refinement turns.
    const turns = await ctx.db
      .query("session_turns")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .take(4);
    if (turns.some((turn) => turn.userInput)) return null;

    // `specialties` is an array field, so it can't be indexed — the specialty
    // filter has to run in memory, which means the scan feeding it must not be
    // truncated first. A prefix would silently hide declaring xolacers the
    // moment the roster outgrew it, and the failure looks like "no suggestion"
    // rather than an error. Bounded in practice by roster size: this is the
    // directory, a curated set.
    // ponytail: full active-roster scan; needs a denormalized
    // specialty->xolacer index if the roster reaches the low thousands.
    const declaring: Doc<"xolacer_profiles">[] = [];
    for await (const xolacer of ctx.db
      .query("xolacer_profiles")
      .withIndex("by_complete_and_active", (q) =>
        q.eq("complete", true).eq("active", true),
      )) {
      if (xolacer.emotionalProfileId === profile._id) continue;
      if (!xolacer.specialties?.includes(specialty)) continue;
      if (!meetsRatingFloor(xolacer)) continue;
      declaring.push(xolacer);
      if (declaring.length >= MAX_SUGGESTION_CANDIDATES) break;
    }

    const candidates = [];
    for (const xolacer of declaring) {
      // Exact pair lookup, not a scan of this user's rows: a past decline or
      // an expired request must not come back dressed as a fresh
      // recommendation, and a capped scan would eventually miss one. This is
      // what by_user_and_xolacer exists for.
      const existing = await ctx.db
        .query("xolacer_conversations")
        .withIndex("by_user_and_xolacer", (q) =>
          q
            .eq("userProfileId", profile._id)
            .eq("xolacerProfileId", xolacer.emotionalProfileId),
        )
        .unique();
      if (existing) continue;
      const openCount = await countOpen(ctx, xolacer.emotionalProfileId);
      if (!xolacerAvailable(xolacer, openCount)) continue;
      candidates.push({
        xolacerProfileId: xolacer.emotionalProfileId,
        openCount,
        xolacer,
      });
    }

    const [best] = rankSuggestionCandidates(candidates, args.sessionId);
    if (!best) return null;
    return {
      xolacerProfileId: best.xolacerProfileId,
      displayName: best.xolacer.displayName ?? "",
      photoUrl: best.xolacer.photoUrl,
      specialties: best.xolacer.specialties ?? [],
      specialty,
      ...publicRating(best.xolacer),
    };
  },
});

// ============================================================
// Conversations
// ============================================================

export const myConversations = query({
  args: {},
  returns: v.array(conversationRowValidator),
  handler: async (ctx) => {
    if (!chatEnabled()) return [];
    const { user, profile } = await requireAuth(ctx);

    const asUser = await ctx.db
      .query("xolacer_conversations")
      .withIndex("by_user_and_status", (q) => q.eq("userProfileId", profile._id))
      .take(100);

    const asXolacer = user.isXolacer
      ? await ctx.db
          .query("xolacer_conversations")
          .withIndex("by_xolacer_and_status", (q) =>
            q.eq("xolacerProfileId", profile._id),
          )
          .take(100)
      : [];

    const rows = [];
    for (const conversation of asUser) {
      const xolacer = await getXolacerProfileByProfileId(
        ctx,
        conversation.xolacerProfileId,
      );
      rows.push({
        id: conversation._id,
        role: "user" as const,
        status: conversation.status,
        closedReason: conversation.closedReason,
        streamChannelId: conversation.streamChannelId,
        lastMessageAt: conversation.lastMessageAt,
        requestedAt: conversation.requestedAt,
        xolacerProfileId: conversation.xolacerProfileId,
        counterpartName: xolacer?.displayName ?? "Xolacer",
        counterpartPhotoUrl: xolacer?.photoUrl,
      });
    }
    for (const conversation of asXolacer) {
      rows.push({
        id: conversation._id,
        role: "xolacer" as const,
        status: conversation.status,
        closedReason: conversation.closedReason,
        streamChannelId: conversation.streamChannelId,
        lastMessageAt: conversation.lastMessageAt,
        requestedAt: conversation.requestedAt,
        xolacerProfileId: conversation.xolacerProfileId,
        counterpartName: pseudonym(conversation.userProfileId),
        counterpartPhotoUrl: await seekerImage(ctx, conversation.userProfileId),
        origin: conversation.origin,
      });
    }

    // Requested first (xolacer inbox), then most recent activity.
    rows.sort((a, b) => {
      const aKey = a.lastMessageAt ?? a.requestedAt;
      const bKey = b.lastMessageAt ?? b.requestedAt;
      return bKey - aKey;
    });
    return rows;
  },
});

export const getConversation = query({
  args: { conversationId: v.id("xolacer_conversations") },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("xolacer_conversations"),
      role: v.union(v.literal("user"), v.literal("xolacer")),
      status: statusValidator,
      closedReason: closedReasonValidator,
      streamChannelId: v.optional(v.string()),
      lastMessageAt: v.optional(v.number()),
      requestedAt: v.number(),
      resumable: v.boolean(),
      canRate: v.boolean(),
      myRating: v.optional(v.number()),
      counterpartName: v.string(),
      counterpartPhotoUrl: v.optional(v.string()),
      myStreamUserId: v.id("emotional_profiles"),
      origin: originValidator,
    }),
  ),
  handler: async (ctx, args) => {
    if (!chatEnabled()) return null;
    const { profile, conversation, role } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );

    const xolacer = await getXolacerProfileByProfileId(
      ctx,
      conversation.xolacerProfileId,
    );
    const openCount = await countOpen(ctx, conversation.xolacerProfileId);
    // Resting → Open without a fresh request only while the xolacer is
    // still published, active, and under cap.
    const resumable = xolacerAvailable(xolacer, openCount);

    const existingRating =
      role === "user" ? await findRating(ctx, conversation._id) : null;

    return {
      id: conversation._id,
      role,
      status: conversation.status,
      closedReason: conversation.closedReason,
      streamChannelId: conversation.streamChannelId,
      lastMessageAt: conversation.lastMessageAt,
      requestedAt: conversation.requestedAt,
      resumable,
      canRate: role === "user" && hasRealExchange(conversation),
      myRating: existingRating?.rating,
      counterpartName:
        role === "user"
          ? (xolacer?.displayName ?? "Xolacer")
          : pseudonym(conversation.userProfileId),
      counterpartPhotoUrl:
        role === "user"
          ? xolacer?.photoUrl
          : await seekerImage(ctx, conversation.userProfileId),
      myStreamUserId: profile._id,
      // Returned to both roles, matching myConversations: origin is the
      // seeker's own data, so it leaks nothing back to them, and one field
      // beats two code paths that can drift. Role-gating lives in the badge,
      // which renders on xolacer-role rows only.
      origin: conversation.origin,
    };
  },
});

/**
 * Structural only: that a request was sent, and how fresh the sender was.
 * No specialty, no theme, no session content — that would put the classifier's
 * read of a person into analytics before the person has said a word.
 */
async function captureRequestSent(
  ctx: MutationCtx,
  distinctId: string,
  origin: ConversationOrigin,
) {
  await posthog.capture(ctx, {
    distinctId,
    event: "xolacer_request_sent",
    properties: { origin },
  });
}

/**
 * Origin, derived server-side from recency. No session id reaches this
 * mutation and none is stored — the specialty on the Understanding is the
 * only thing read, so no session→conversation link exists at any point.
 */
async function deriveOrigin(
  ctx: QueryCtx,
  userProfileId: Id<"emotional_profiles">,
  xolacer: Doc<"xolacer_profiles">,
) {
  // Streamed rather than collected: one row is enough to answer "suggestion",
  // so a match stops the scan. Only the "direct" answer walks the whole
  // window, and that is one row per session for one user over 24 hours.
  const since = Date.now() - SUGGESTION_ORIGIN_WINDOW_MS;
  for await (const row of ctx.db
    .query("emotional_metadata")
    .withIndex("by_profile_createdAt", (q) =>
      q.eq("emotionalProfileId", userProfileId).gte("createdAt", since),
    )) {
    const suggested = row.suggestedSpecialty;
    if (!suggested) continue;
    if (conversationOrigin([suggested], xolacer.specialties) === "suggestion") {
      return "suggestion";
    }
  }
  return "direct";
}

export const requestConversation = mutation({
  args: { xolacerProfileId: v.id("emotional_profiles") },
  returns: v.id("xolacer_conversations"),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const { user, profile } = await requireAuth(ctx);
    if (profile._id === args.xolacerProfileId) {
      throw new Error("Cannot request a conversation with yourself");
    }

    const xolacer = await getXolacerProfileByProfileId(ctx, args.xolacerProfileId);
    const openCount = await countOpen(ctx, args.xolacerProfileId);
    if (!xolacerAvailable(xolacer, openCount)) {
      throw new Error("This xolacer is not taking conversations right now");
    }

    const existing = await ctx.db
      .query("xolacer_conversations")
      .withIndex("by_user_and_xolacer", (q) =>
        q.eq("userProfileId", profile._id).eq("xolacerProfileId", args.xolacerProfileId),
      )
      .unique();

    if (existing) {
      // One conversation per pair, ever. Re-requesting reopens the same row.
      if (existing.status === "requested" || existing.status === "open") {
        return existing._id;
      }
      if (existing.status === "resting") {
        // Profile CTA says "Open chat" here; a request is just a resume.
        await ctx.db.patch(existing._id, { status: "open" });
        return existing._id;
      }
      // Closed: declined/expired may re-request; blocked/xolacer_left may not.
      if (
        existing.closedReason === "blocked" ||
        existing.closedReason === "xolacer_left"
      ) {
        throw new Error("This conversation can no longer be reopened");
      }
      await requirePendingRequestSlot(ctx, profile._id);
      // Overwritten, never merged: a re-request from the roster months later
      // must badge as direct.
      const origin = await deriveOrigin(ctx, profile._id, xolacer);
      await ctx.db.patch(existing._id, {
        status: "requested",
        closedReason: undefined,
        requestedAt: Date.now(),
        origin,
      });
      await captureRequestSent(ctx, user.tokenIdentifier, origin);
      return existing._id;
    }

    await requirePendingRequestSlot(ctx, profile._id);
    const origin = await deriveOrigin(ctx, profile._id, xolacer);
    const conversationId = await ctx.db.insert("xolacer_conversations", {
      userProfileId: profile._id,
      xolacerProfileId: args.xolacerProfileId,
      status: "requested",
      requestedAt: Date.now(),
      origin,
    });
    await captureRequestSent(ctx, user.tokenIdentifier, origin);
    return conversationId;
  },
});

/** Xolacer-side validation for accept — runs in query ctx so the action stays thin. */
export const getForAccept = internalQuery({
  args: { conversationId: v.id("xolacer_conversations") },
  returns: v.object({
    userProfileId: v.id("emotional_profiles"),
    xolacerProfileId: v.id("emotional_profiles"),
    xolacerName: v.string(),
    xolacerPhotoUrl: v.optional(v.string()),
    userPhotoUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { conversation, role } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );
    if (role !== "xolacer") throw new Error("Only the xolacer can accept");
    if (conversation.status !== "requested") {
      throw new Error("Request is no longer pending");
    }
    const xolacer = await getXolacerProfileByProfileId(
      ctx,
      conversation.xolacerProfileId,
    );
    return {
      userProfileId: conversation.userProfileId,
      xolacerProfileId: conversation.xolacerProfileId,
      xolacerName: xolacer?.displayName ?? "Xolacer",
      xolacerPhotoUrl: xolacer?.photoUrl,
      userPhotoUrl: await seekerImage(ctx, conversation.userProfileId),
    };
  },
});

export const markAccepted = internalMutation({
  args: {
    conversationId: v.id("xolacer_conversations"),
    streamChannelId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.status !== "requested") return;
    await ctx.db.patch(args.conversationId, {
      status: "open",
      streamChannelId: args.streamChannelId,
      acceptedAt: Date.now(),
      lastMessageAt: Date.now(),
    });
  },
});

/**
 * Accept a request: create the Stream channel (network I/O → action), then
 * flip the row to open. Channel id is deterministic per conversation, so a
 * retry after a partial failure is idempotent.
 */
export const acceptRequest = action({
  args: { conversationId: v.id("xolacer_conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const info: {
      userProfileId: Id<"emotional_profiles">;
      xolacerProfileId: Id<"emotional_profiles">;
      xolacerName: string;
      xolacerPhotoUrl?: string;
      userPhotoUrl?: string;
    } = await ctx.runQuery(internal.xolacerChat.getForAccept, {
      conversationId: args.conversationId,
    });

    const channelId = `xolacer_${args.conversationId}`;
    await upsertStreamUsers([
      {
        id: info.xolacerProfileId,
        name: info.xolacerName,
        image: info.xolacerPhotoUrl,
      },
      {
        id: info.userProfileId,
        name: pseudonym(info.userProfileId),
        image: info.userPhotoUrl,
      },
    ]);
    await createXolacerChannel(
      channelId,
      [info.xolacerProfileId, info.userProfileId],
      info.xolacerProfileId,
    );

    await ctx.runMutation(internal.xolacerChat.markAccepted, {
      conversationId: args.conversationId,
      streamChannelId: channelId,
    });
    return null;
  },
});

export const declineRequest = mutation({
  args: { conversationId: v.id("xolacer_conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const { conversation, role } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );
    if (role !== "xolacer") throw new Error("Only the xolacer can decline");
    if (conversation.status !== "requested") return null;
    await ctx.db.patch(args.conversationId, {
      status: "closed",
      closedReason: "declined",
    });
    return null;
  },
});

export const resumeConversation = mutation({
  args: { conversationId: v.id("xolacer_conversations") },
  returns: v.object({ resumed: v.boolean() }),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const { conversation } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );
    if (conversation.status !== "resting") return { resumed: conversation.status === "open" };

    const xolacer = await getXolacerProfileByProfileId(
      ctx,
      conversation.xolacerProfileId,
    );
    const openCount = await countOpen(ctx, conversation.xolacerProfileId);
    if (!xolacerAvailable(xolacer, openCount)) {
      return { resumed: false };
    }
    await ctx.db.patch(args.conversationId, {
      status: "open",
      lastMessageAt: Date.now(),
    });
    return { resumed: true };
  },
});

/** Client calls this after each sent message; drives the resting sweep. */
export const touchConversation = mutation({
  args: { conversationId: v.id("xolacer_conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) return null;
    const { conversation } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );
    if (conversation.status !== "open") return null;
    await ctx.db.patch(args.conversationId, { lastMessageAt: Date.now() });
    return null;
  },
});

// ============================================================
// Ratings
// ============================================================

/**
 * Rate the xolacer, or change a rating already given. Only the person who
 * asked to talk may rate, and only once real messages were exchanged.
 *
 * The xolacer's counters are denormalized (Convex has no count operator), so
 * an edit applies the delta rather than re-summing — the aggregate stays O(1)
 * no matter how many conversations a xolacer has held.
 */
export const rateConversation = mutation({
  args: {
    conversationId: v.id("xolacer_conversations"),
    rating: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");

    const rounded = Math.round(args.rating);
    if (rounded < 1 || rounded > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const { profile, conversation, role } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );
    // A xolacer never rates the people who come to them — the relationship
    // isn't symmetric and a rated user would be a reason not to reach out.
    if (role !== "user") throw new Error("Only the requester can rate");
    if (!hasRealExchange(conversation)) {
      throw new Error("Nothing to rate yet");
    }

    const xolacer = await ctx.db
      .query("xolacer_profiles")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", conversation.xolacerProfileId),
      )
      .unique();
    if (!xolacer) throw new Error("Xolacer profile not found");

    const existing = await findRating(ctx, args.conversationId);
    const now = Date.now();

    if (existing) {
      if (existing.rating === rounded) return null;
      await ctx.db.patch(existing._id, { rating: rounded, updatedAt: now });
      await ctx.db.patch(xolacer._id, {
        ratingSum: (xolacer.ratingSum ?? 0) - existing.rating + rounded,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("conversation_ratings", {
      conversationId: args.conversationId,
      raterProfileId: profile._id,
      xolacerProfileId: conversation.xolacerProfileId,
      rating: rounded,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(xolacer._id, {
      ratingSum: (xolacer.ratingSum ?? 0) + rounded,
      ratingCount: (xolacer.ratingCount ?? 0) + 1,
      updatedAt: now,
    });
    return null;
  },
});

// ============================================================
// Stream token
// ============================================================

export const getStreamIdentity = internalQuery({
  args: {},
  returns: v.object({
    userId: v.id("emotional_profiles"),
    name: v.string(),
    image: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const { user, profile } = await requireAuth(ctx);
    const xolacer = user.isXolacer
      ? await getXolacerProfileByProfileId(ctx, profile._id)
      : null;
    return {
      userId: profile._id,
      name: xolacer?.complete ? (xolacer.displayName ?? "") : pseudonym(profile._id),
      image: xolacer?.complete
        ? xolacer.photoUrl
        : await seekerImage(ctx, profile._id),
    };
  },
});

/**
 * Mint the Stream user token for the authenticated user. The Stream user id
 * is always the server-derived pseudonymous profile id — never a client arg.
 */
export const getStreamToken = action({
  args: {},
  returns: v.object({ apiKey: v.string(), token: v.string(), userId: v.string() }),
  handler: async (ctx) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const identity: {
      userId: Id<"emotional_profiles">;
      name: string;
      image?: string;
    } = await ctx.runQuery(internal.xolacerChat.getStreamIdentity, {});
    await upsertStreamUsers([
      { id: identity.userId, name: identity.name, image: identity.image },
    ]);
    const token = await mintUserToken(identity.userId);
    // apiKey ships with the token so the pair can never disagree — see
    // getStreamApiKey. Publishable value, safe to hand to the client.
    return {
      apiKey: getStreamApiKey(),
      token,
      userId: identity.userId as string,
    };
  },
});

// ============================================================
// Xolacer profile management
// ============================================================

export const myXolacerProfile = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      displayName: v.optional(v.string()),
      bio: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
      specialties: v.array(specialtyValidator),
      complete: v.boolean(),
      active: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    if (!chatEnabled()) return null;
    const { user, profile } = await requireAuth(ctx);
    if (!user.isXolacer) return null;
    const xolacer = await getXolacerProfileByProfileId(ctx, profile._id);
    if (!xolacer) return null;
    return {
      displayName: xolacer.displayName,
      bio: xolacer.bio,
      photoUrl: xolacer.photoUrl,
      specialties: xolacer.specialties ?? [],
      complete: xolacer.complete,
      active: xolacer.active,
    };
  },
});

export const upsertMyXolacerProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    specialties: v.optional(v.array(specialtyValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const { user, profile } = await requireAuth(ctx);
    if (!user.isXolacer) throw new Error("Not a xolacer");

    if (args.bio !== undefined && args.bio.length > 160) {
      throw new Error("Bio must be 160 characters or fewer");
    }
    if (args.displayName !== undefined && args.displayName.length > 40) {
      throw new Error("Display name must be 40 characters or fewer");
    }
    if (args.specialties && args.specialties.length > MAX_SPECIALTIES) {
      throw new Error(`Pick at most ${MAX_SPECIALTIES}`);
    }

    const existing = await getXolacerProfileByProfileId(ctx, profile._id);
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return null;
    }
    await ctx.db.insert("xolacer_profiles", {
      emotionalProfileId: profile._id,
      ...args,
      complete: false,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const generatePhotoUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const { user } = await requireAuth(ctx);
    if (!user.isXolacer) throw new Error("Not a xolacer");
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Resolves the uploaded file to its serving URL and stores that, so the rest
 * of the app keeps reading a plain `photoUrl` string. Convex serving URLs are
 * stable, so there's no per-read resolution to do.
 */
export const setXolacerPhoto = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const { user, profile } = await requireAuth(ctx);
    if (!user.isXolacer) throw new Error("Not a xolacer");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Upload not found");

    const existing = await getXolacerProfileByProfileId(ctx, profile._id);
    if (existing) {
      // ponytail: replacing a photo orphans the previous blob — storing only
      // the URL means there's no storageId left to delete. Add a
      // `photoStorageId` field if xolacer photo churn ever matters.
      await ctx.db.patch(existing._id, { photoUrl: url, updatedAt: Date.now() });
      return null;
    }
    await ctx.db.insert("xolacer_profiles", {
      emotionalProfileId: profile._id,
      photoUrl: url,
      complete: false,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Publish = the server-side mirror of "all fields present". */
export const publishProfile = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const { user, profile } = await requireAuth(ctx);
    if (!user.isXolacer) throw new Error("Not a xolacer");

    const xolacer = await getXolacerProfileByProfileId(ctx, profile._id);
    if (
      !xolacer?.displayName ||
      !xolacer.bio ||
      !xolacer.photoUrl ||
      !xolacer.specialties?.length
    ) {
      throw new Error("Profile is incomplete");
    }
    await ctx.db.patch(xolacer._id, { complete: true, updatedAt: Date.now() });
    return null;
  },
});

/**
 * Pause / unpause. `active` already gates the directory index and both
 * `xolacerAvailable` call sites, so flipping it is the whole feature: paused
 * xolacers leave the roster and can't be requested or resumed, while every
 * conversation they already have keeps working. Deliberately not a "go
 * offline" state — it survives app restarts, because the point is a xolacer
 * stepping away for a week, not for an evening.
 */
export const setXolacerActive = mutation({
  args: { active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Xolacer chat is not available");
    const { user, profile } = await requireAuth(ctx);
    if (!user.isXolacer) throw new Error("Not a xolacer");

    const xolacer = await getXolacerProfileByProfileId(ctx, profile._id);
    if (!xolacer) throw new Error("No xolacer profile");
    await ctx.db.patch(xolacer._id, { active: args.active, updatedAt: Date.now() });
    return null;
  },
});

// ============================================================
// Lifecycle sweep (cron)
// ============================================================

export const sweep = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();

    // Open but quiet for 14 days → resting (silent; frees the cap slot).
    const quiet = await ctx.db
      .query("xolacer_conversations")
      .withIndex("by_status_and_lastMessageAt", (q) =>
        q.eq("status", "open").lt("lastMessageAt", now - RESTING_AFTER_MS),
      )
      .take(100);
    for (const conversation of quiet) {
      await ctx.db.patch(conversation._id, { status: "resting" });
    }

    // Requested but unanswered for 7 days → closed/expired.
    // Requested rows are few (single-digit xolacers), so a bounded take +
    // in-memory age check is fine. ponytail: index on requestedAt if this grows.
    const requested = await ctx.db
      .query("xolacer_conversations")
      .withIndex("by_status_and_lastMessageAt", (q) => q.eq("status", "requested"))
      .take(100);
    for (const conversation of requested) {
      if (conversation.requestedAt < now - REQUEST_EXPIRY_MS) {
        await ctx.db.patch(conversation._id, {
          status: "closed",
          closedReason: "expired",
        });
      }
    }
  },
});

// ============================================================
// Account-deletion support
// ============================================================

/**
 * Fail-open Stream cleanup: a Stream outage must never block a user's
 * deletion request. Failures are logged for manual retry.
 */
export const purgeStreamUser = internalAction({
  args: { profileId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      await deleteStreamUser(args.profileId);
    } catch (error) {
      console.error(
        `[xolacerChat] Stream user deletion failed for ${args.profileId}; retry manually`,
        error,
      );
    }
    return null;
  },
});
