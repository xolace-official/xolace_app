import { v } from "convex/values";
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
import { QueryCtx } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import {
  createListenerChannel,
  deleteStreamUser,
  mintUserToken,
  upsertStreamUsers,
} from "./integrations/stream";

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
    v.literal("listener_left"),
  ),
);
const conversationRowValidator = v.object({
  id: v.id("listener_conversations"),
  role: v.union(v.literal("user"), v.literal("listener")),
  status: statusValidator,
  closedReason: closedReasonValidator,
  streamChannelId: v.optional(v.string()),
  lastMessageAt: v.optional(v.number()),
  requestedAt: v.number(),
  counterpartName: v.string(),
  counterpartPhotoUrl: v.optional(v.string()),
});

// Volume cap counts OPEN conversations only — resting/closed free the slot.
export const MAX_OPEN_CONVERSATIONS = 8;
const REQUEST_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const RESTING_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

// Global kill-switch (env-var gate, same pattern as devTools). The feature
// ships dark until the ambassador-consent + DPA review clears.
function chatEnabled() {
  return process.env.LISTENER_CHAT_ENABLED === "true";
}

/**
 * Listener-side counterparts are anonymous users — no public identity exists
 * for them by design. A stable pseudonym derived from the profile id keeps
 * multiple conversations distinguishable without leaking anything.
 */
function pseudonym(profileId: string) {
  return `Guest ${profileId.slice(-4).toUpperCase()}`;
}

async function countOpen(ctx: QueryCtx, listenerProfileId: Id<"emotional_profiles">) {
  const open = await ctx.db
    .query("listener_conversations")
    .withIndex("by_listener_and_status", (q) =>
      q.eq("listenerProfileId", listenerProfileId).eq("status", "open"),
    )
    .take(MAX_OPEN_CONVERSATIONS);
  return open.length;
}

function listenerAvailable(profile: Doc<"listener_profiles"> | null, openCount: number) {
  return Boolean(
    profile && profile.complete && profile.active && openCount < MAX_OPEN_CONVERSATIONS,
  );
}

async function getListenerProfileByProfileId(
  ctx: QueryCtx,
  emotionalProfileId: Id<"emotional_profiles">,
) {
  return await ctx.db
    .query("listener_profiles")
    .withIndex("by_profile", (q) => q.eq("emotionalProfileId", emotionalProfileId))
    .unique();
}

async function requireConversationParticipant(
  ctx: QueryCtx,
  conversationId: Id<"listener_conversations">,
) {
  const { user, profile } = await requireAuth(ctx);
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  const role =
    conversation.userProfileId === profile._id
      ? ("user" as const)
      : conversation.listenerProfileId === profile._id
        ? ("listener" as const)
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
      isListener: v.boolean(),
      listenerProfileComplete: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    if (!chatEnabled()) return { enabled: false as const };
    const { user, profile } = await requireAuth(ctx);
    const listenerProfile = user.isListener
      ? await getListenerProfileByProfileId(ctx, profile._id)
      : null;
    return {
      enabled: true as const,
      isListener: Boolean(user.isListener),
      listenerProfileComplete: Boolean(listenerProfile?.complete),
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
      listenerProfileId: v.id("emotional_profiles"),
      displayName: v.string(),
      bio: v.string(),
      photoUrl: v.optional(v.string()),
      atCapacity: v.boolean(),
      listenerSince: v.number(),
    }),
  ),
  handler: async (ctx) => {
    if (!chatEnabled()) return [];
    const { profile } = await requireAuth(ctx);

    const listeners = await ctx.db
      .query("listener_profiles")
      .withIndex("by_complete_and_active", (q) =>
        q.eq("complete", true).eq("active", true),
      )
      .take(50);

    const rows = [];
    for (const listener of listeners) {
      // A listener browsing the roster shouldn't see themselves.
      if (listener.emotionalProfileId === profile._id) continue;
      const openCount = await countOpen(ctx, listener.emotionalProfileId);
      rows.push({
        listenerProfileId: listener.emotionalProfileId,
        displayName: listener.displayName ?? "",
        bio: listener.bio ?? "",
        photoUrl: listener.photoUrl,
        atCapacity: openCount >= MAX_OPEN_CONVERSATIONS,
        listenerSince: listener.createdAt,
      });
    }
    return rows;
  },
});

/** Public profile + my relationship to this listener (drives the CTA). */
export const listenerProfile = query({
  args: { listenerProfileId: v.id("emotional_profiles") },
  returns: v.union(
    v.null(),
    v.object({
      listenerProfileId: v.id("emotional_profiles"),
      displayName: v.string(),
      bio: v.string(),
      photoUrl: v.optional(v.string()),
      listenerSince: v.number(),
      available: v.boolean(),
      conversation: v.union(
        v.null(),
        v.object({
          id: v.id("listener_conversations"),
          status: statusValidator,
          closedReason: closedReasonValidator,
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    if (!chatEnabled()) return null;
    const { profile } = await requireAuth(ctx);

    const listener = await getListenerProfileByProfileId(ctx, args.listenerProfileId);
    if (!listener || !listener.complete) return null;

    const openCount = await countOpen(ctx, args.listenerProfileId);
    const conversation = await ctx.db
      .query("listener_conversations")
      .withIndex("by_user_and_listener", (q) =>
        q.eq("userProfileId", profile._id).eq("listenerProfileId", args.listenerProfileId),
      )
      .unique();

    return {
      listenerProfileId: args.listenerProfileId,
      displayName: listener.displayName ?? "",
      bio: listener.bio ?? "",
      photoUrl: listener.photoUrl,
      listenerSince: listener.createdAt,
      available: listenerAvailable(listener, openCount),
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
      .query("listener_conversations")
      .withIndex("by_user", (q) => q.eq("userProfileId", profile._id))
      .take(100);

    const asListener = user.isListener
      ? await ctx.db
          .query("listener_conversations")
          .withIndex("by_listener_and_status", (q) =>
            q.eq("listenerProfileId", profile._id),
          )
          .take(100)
      : [];

    const rows = [];
    for (const conversation of asUser) {
      const listener = await getListenerProfileByProfileId(
        ctx,
        conversation.listenerProfileId,
      );
      rows.push({
        id: conversation._id,
        role: "user" as const,
        status: conversation.status,
        closedReason: conversation.closedReason,
        streamChannelId: conversation.streamChannelId,
        lastMessageAt: conversation.lastMessageAt,
        requestedAt: conversation.requestedAt,
        counterpartName: listener?.displayName ?? "Listener",
        counterpartPhotoUrl: listener?.photoUrl,
      });
    }
    for (const conversation of asListener) {
      rows.push({
        id: conversation._id,
        role: "listener" as const,
        status: conversation.status,
        closedReason: conversation.closedReason,
        streamChannelId: conversation.streamChannelId,
        lastMessageAt: conversation.lastMessageAt,
        requestedAt: conversation.requestedAt,
        counterpartName: pseudonym(conversation.userProfileId),
        counterpartPhotoUrl: undefined,
      });
    }

    // Requested first (listener inbox), then most recent activity.
    rows.sort((a, b) => {
      const aKey = a.lastMessageAt ?? a.requestedAt;
      const bKey = b.lastMessageAt ?? b.requestedAt;
      return bKey - aKey;
    });
    return rows;
  },
});

export const getConversation = query({
  args: { conversationId: v.id("listener_conversations") },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("listener_conversations"),
      role: v.union(v.literal("user"), v.literal("listener")),
      status: statusValidator,
      closedReason: closedReasonValidator,
      streamChannelId: v.optional(v.string()),
      lastMessageAt: v.optional(v.number()),
      requestedAt: v.number(),
      resumable: v.boolean(),
      counterpartName: v.string(),
      counterpartPhotoUrl: v.optional(v.string()),
      myStreamUserId: v.id("emotional_profiles"),
    }),
  ),
  handler: async (ctx, args) => {
    if (!chatEnabled()) return null;
    const { profile, conversation, role } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );

    const listener = await getListenerProfileByProfileId(
      ctx,
      conversation.listenerProfileId,
    );
    const openCount = await countOpen(ctx, conversation.listenerProfileId);
    // Resting → Open without a fresh request only while the listener is
    // still published, active, and under cap.
    const resumable = listenerAvailable(listener, openCount);

    return {
      id: conversation._id,
      role,
      status: conversation.status,
      closedReason: conversation.closedReason,
      streamChannelId: conversation.streamChannelId,
      lastMessageAt: conversation.lastMessageAt,
      requestedAt: conversation.requestedAt,
      resumable,
      counterpartName:
        role === "user"
          ? (listener?.displayName ?? "Listener")
          : pseudonym(conversation.userProfileId),
      counterpartPhotoUrl: role === "user" ? listener?.photoUrl : undefined,
      myStreamUserId: profile._id,
    };
  },
});

export const requestConversation = mutation({
  args: { listenerProfileId: v.id("emotional_profiles") },
  returns: v.id("listener_conversations"),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const { profile } = await requireAuth(ctx);
    if (profile._id === args.listenerProfileId) {
      throw new Error("Cannot request a conversation with yourself");
    }

    const listener = await getListenerProfileByProfileId(ctx, args.listenerProfileId);
    const openCount = await countOpen(ctx, args.listenerProfileId);
    if (!listenerAvailable(listener, openCount)) {
      throw new Error("This listener is not taking conversations right now");
    }

    const existing = await ctx.db
      .query("listener_conversations")
      .withIndex("by_user_and_listener", (q) =>
        q.eq("userProfileId", profile._id).eq("listenerProfileId", args.listenerProfileId),
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
      // Closed: declined/expired may re-request; blocked/listener_left may not.
      if (
        existing.closedReason === "blocked" ||
        existing.closedReason === "listener_left"
      ) {
        throw new Error("This conversation can no longer be reopened");
      }
      await ctx.db.patch(existing._id, {
        status: "requested",
        closedReason: undefined,
        requestedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("listener_conversations", {
      userProfileId: profile._id,
      listenerProfileId: args.listenerProfileId,
      status: "requested",
      requestedAt: Date.now(),
    });
  },
});

/** Listener-side validation for accept — runs in query ctx so the action stays thin. */
export const getForAccept = internalQuery({
  args: { conversationId: v.id("listener_conversations") },
  returns: v.object({
    userProfileId: v.id("emotional_profiles"),
    listenerProfileId: v.id("emotional_profiles"),
    listenerName: v.string(),
    listenerPhotoUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { conversation, role } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );
    if (role !== "listener") throw new Error("Only the listener can accept");
    if (conversation.status !== "requested") {
      throw new Error("Request is no longer pending");
    }
    const listener = await getListenerProfileByProfileId(
      ctx,
      conversation.listenerProfileId,
    );
    return {
      userProfileId: conversation.userProfileId,
      listenerProfileId: conversation.listenerProfileId,
      listenerName: listener?.displayName ?? "Listener",
      listenerPhotoUrl: listener?.photoUrl,
    };
  },
});

export const markAccepted = internalMutation({
  args: {
    conversationId: v.id("listener_conversations"),
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
  args: { conversationId: v.id("listener_conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const info: {
      userProfileId: Id<"emotional_profiles">;
      listenerProfileId: Id<"emotional_profiles">;
      listenerName: string;
      listenerPhotoUrl?: string;
    } = await ctx.runQuery(internal.listenerChat.getForAccept, {
      conversationId: args.conversationId,
    });

    const channelId = `listener_${args.conversationId}`;
    await upsertStreamUsers([
      {
        id: info.listenerProfileId,
        name: info.listenerName,
        image: info.listenerPhotoUrl,
      },
      { id: info.userProfileId, name: pseudonym(info.userProfileId) },
    ]);
    await createListenerChannel(
      channelId,
      [info.listenerProfileId, info.userProfileId],
      info.listenerProfileId,
    );

    await ctx.runMutation(internal.listenerChat.markAccepted, {
      conversationId: args.conversationId,
      streamChannelId: channelId,
    });
    return null;
  },
});

export const declineRequest = mutation({
  args: { conversationId: v.id("listener_conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const { conversation, role } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );
    if (role !== "listener") throw new Error("Only the listener can decline");
    if (conversation.status !== "requested") return null;
    await ctx.db.patch(args.conversationId, {
      status: "closed",
      closedReason: "declined",
    });
    return null;
  },
});

export const resumeConversation = mutation({
  args: { conversationId: v.id("listener_conversations") },
  returns: v.object({ resumed: v.boolean() }),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const { conversation } = await requireConversationParticipant(
      ctx,
      args.conversationId,
    );
    if (conversation.status !== "resting") return { resumed: conversation.status === "open" };

    const listener = await getListenerProfileByProfileId(
      ctx,
      conversation.listenerProfileId,
    );
    const openCount = await countOpen(ctx, conversation.listenerProfileId);
    if (!listenerAvailable(listener, openCount)) {
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
  args: { conversationId: v.id("listener_conversations") },
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
    const listener = user.isListener
      ? await getListenerProfileByProfileId(ctx, profile._id)
      : null;
    return {
      userId: profile._id,
      name: listener?.complete ? (listener.displayName ?? "") : pseudonym(profile._id),
      image: listener?.complete ? listener.photoUrl : undefined,
    };
  },
});

/**
 * Mint the Stream user token for the authenticated user. The Stream user id
 * is always the server-derived pseudonymous profile id — never a client arg.
 */
export const getStreamToken = action({
  args: {},
  returns: v.object({ token: v.string(), userId: v.string() }),
  handler: async (ctx) => {
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const identity: {
      userId: Id<"emotional_profiles">;
      name: string;
      image?: string;
    } = await ctx.runQuery(internal.listenerChat.getStreamIdentity, {});
    await upsertStreamUsers([
      { id: identity.userId, name: identity.name, image: identity.image },
    ]);
    const token = await mintUserToken(identity.userId);
    return { token, userId: identity.userId as string };
  },
});

// ============================================================
// Listener profile management
// ============================================================

export const myListenerProfile = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      displayName: v.optional(v.string()),
      bio: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
      complete: v.boolean(),
      active: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    if (!chatEnabled()) return null;
    const { user, profile } = await requireAuth(ctx);
    if (!user.isListener) return null;
    const listener = await getListenerProfileByProfileId(ctx, profile._id);
    if (!listener) return null;
    return {
      displayName: listener.displayName,
      bio: listener.bio,
      photoUrl: listener.photoUrl,
      complete: listener.complete,
      active: listener.active,
    };
  },
});

export const upsertMyListenerProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const { user, profile } = await requireAuth(ctx);
    if (!user.isListener) throw new Error("Not a listener");

    if (args.bio !== undefined && args.bio.length > 160) {
      throw new Error("Bio must be 160 characters or fewer");
    }
    if (args.displayName !== undefined && args.displayName.length > 40) {
      throw new Error("Display name must be 40 characters or fewer");
    }

    const existing = await getListenerProfileByProfileId(ctx, profile._id);
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return null;
    }
    await ctx.db.insert("listener_profiles", {
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
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const { user } = await requireAuth(ctx);
    if (!user.isListener) throw new Error("Not a listener");
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Resolves the uploaded file to its serving URL and stores that, so the rest
 * of the app keeps reading a plain `photoUrl` string. Convex serving URLs are
 * stable, so there's no per-read resolution to do.
 */
export const setListenerPhoto = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const { user, profile } = await requireAuth(ctx);
    if (!user.isListener) throw new Error("Not a listener");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Upload not found");

    const existing = await getListenerProfileByProfileId(ctx, profile._id);
    if (existing) {
      // ponytail: replacing a photo orphans the previous blob — storing only
      // the URL means there's no storageId left to delete. Add a
      // `photoStorageId` field if listener photo churn ever matters.
      await ctx.db.patch(existing._id, { photoUrl: url, updatedAt: Date.now() });
      return null;
    }
    await ctx.db.insert("listener_profiles", {
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
    if (!chatEnabled()) throw new Error("Listener chat is not available");
    const { user, profile } = await requireAuth(ctx);
    if (!user.isListener) throw new Error("Not a listener");

    const listener = await getListenerProfileByProfileId(ctx, profile._id);
    if (!listener?.displayName || !listener.bio || !listener.photoUrl) {
      throw new Error("Profile is incomplete");
    }
    await ctx.db.patch(listener._id, { complete: true, updatedAt: Date.now() });
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
      .query("listener_conversations")
      .withIndex("by_status_and_lastMessageAt", (q) =>
        q.eq("status", "open").lt("lastMessageAt", now - RESTING_AFTER_MS),
      )
      .take(100);
    for (const conversation of quiet) {
      await ctx.db.patch(conversation._id, { status: "resting" });
    }

    // Requested but unanswered for 7 days → closed/expired.
    // Requested rows are few (single-digit listeners), so a bounded take +
    // in-memory age check is fine. ponytail: index on requestedAt if this grows.
    const requested = await ctx.db
      .query("listener_conversations")
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
        `[listenerChat] Stream user deletion failed for ${args.profileId}; retry manually`,
        error,
      );
    }
    return null;
  },
});
