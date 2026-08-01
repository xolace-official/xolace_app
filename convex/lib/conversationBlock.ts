import type { Doc } from "../_generated/dataModel";

type Conversation = Doc<"xolacer_conversations">;
type ClosedReason = Conversation["closedReason"];

type BlockPlanInputs = Pick<
  Conversation,
  "status" | "streamChannelId" | "closedReason"
>;
type RatingInputs = Pick<
  Conversation,
  "closedReason" | "acceptedAt" | "lastMessageAt"
>;

/**
 * What blocking this conversation has to do.
 *
 * - `noop` — already blocked. Blocking twice is harmless, so a retry after a
 *   network failure must not error and must not make a second Stream call.
 * - `channelToFreeze` — absent for a still-`requested` conversation, which has
 *   no Stream channel yet: only the row is written.
 *
 * A row closed for any *other* reason is still blockable. Only `blocked` and
 * `xolacer_left` stop `requestConversation` reopening a pair, so a declined or
 * expired request leaves the seeker free to come back — exactly what blocking
 * exists to prevent. Noop-ing on all of `closed` would take the action, report
 * success and change nothing.
 */
export function planBlock(conversation: BlockPlanInputs): {
  noop: boolean;
  channelToFreeze?: string;
} {
  if (isBlocked(conversation.closedReason)) return { noop: true };
  return { noop: false, channelToFreeze: conversation.streamChannelId };
}

/**
 * The single blocked check. List-hiding and rating suppression both read this
 * one predicate so they cannot drift apart — a blocked conversation that still
 * offered a rating would invite someone to score a person they just escaped.
 */
export function isBlocked(closedReason: ClosedReason): boolean {
  return closedReason === "blocked";
}

/**
 * The abuse guard: `lastMessageAt` is stamped once on accept and again by
 * `touchConversation` on every send, so a later timestamp is proof that at
 * least one real message followed the handshake. Without it, a request that
 * was accepted and then ignored could still be rated.
 */
export function hasRealExchange(conversation: RatingInputs): boolean {
  return Boolean(
    conversation.acceptedAt &&
      conversation.lastMessageAt &&
      conversation.lastMessageAt > conversation.acceptedAt,
  );
}

/**
 * May this participant rate this conversation? A xolacer never rates the
 * people who come to them, nothing is rateable before a real exchange, and a
 * blocked conversation is never rateable by anyone.
 */
export function canRate(
  conversation: RatingInputs,
  role: "user" | "xolacer",
): boolean {
  return (
    role === "user" &&
    !isBlocked(conversation.closedReason) &&
    hasRealExchange(conversation)
  );
}
