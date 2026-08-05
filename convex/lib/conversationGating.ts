/**
 * Every "may this conversation happen?" decision, in one place: blocking,
 * block symmetry across the two role-orderings a pair can hold, and the
 * open-conversation caps both sides are held to.
 */
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
 * Is either direction of this pair blocked?
 *
 * Two people can hold two independent rows — one where A asked B, one where B
 * asked A — and a block only ever closed the row it was filed on. That left
 * the person who blocked findable and reachable through the reverse role. The
 * pair is the unit a block applies to, so both rows are read wherever one used
 * to be. Either argument is absent when that direction was never opened.
 */
export function isPairBlocked(
  forward: Pick<Conversation, "closedReason"> | null | undefined,
  reverse: Pick<Conversation, "closedReason"> | null | undefined,
): boolean {
  return isBlocked(forward?.closedReason) || isBlocked(reverse?.closedReason);
}

/**
 * Has this party used up their simultaneously-open conversations?
 *
 * Parameterized by cap so the xolacer side (8) and the seeker side (3) run the
 * same comparison. `openCount` comes from a `.take(cap)`, so it saturates
 * rather than overcounting — `>=` is what makes a grandfathered seeker already
 * past the cap read as full instead of wrapping around.
 */
export function isAtOpenCap(openCount: number, cap: number): boolean {
  return openCount >= cap;
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
