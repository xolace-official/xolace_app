import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Authenticate the current request and return user + profile.
 * Throws if unauthenticated or user not found.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!user) {
    throw new Error("User not found. Call getOrCreate first.");
  }

  if (user.accountStatus !== "active") {
    throw new Error("Account is not active");
  }

  const profile = await ctx.db.get(user.emotionalProfileId);
  if (!profile) {
    throw new Error("Emotional profile not found");
  }

  return { user, profile, identity };
}

/**
 * Verify that a session belongs to the authenticated user's profile.
 * Returns user, profile, and the session document.
 */
export async function requireSessionOwnership(
  ctx: QueryCtx | MutationCtx,
  sessionId: Id<"sessions">
) {
  const { user, profile, identity } = await requireAuth(ctx);

  const session = await ctx.db.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  if (session.emotionalProfileId !== profile._id) {
    throw new Error("Session does not belong to this user");
  }

  return { user, profile, session, identity };
}
