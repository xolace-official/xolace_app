import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Ensure the request is authenticated and return the authenticated user, their emotional profile, and the identity.
 *
 * @returns An object containing `user` (the user document), `profile` (the user's emotional profile document), and `identity` (the authentication identity)
 * @throws Error when the request has no authenticated identity ("Not authenticated")
 * @throws Error when no user matches the identity ("User not found. Call getOrCreate first.")
 * @throws Error when the user's account status is not `"active"` ("Account is not active")
 * @throws Error when the user's emotional profile cannot be found ("Emotional profile not found")
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
 * Assert that the specified session belongs to the authenticated user's emotional profile.
 *
 * @param sessionId - The id of the session in the `sessions` collection to verify ownership for
 * @returns An object containing `user`, `profile`, `session`, and `identity`
 * @throws Error with message "Session not found" if no session exists for `sessionId`
 * @throws Error with message "Session does not belong to this user" if the session's emotionalProfileId does not match the authenticated profile
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
