/**
 * Every "may this conversation happen?" decision, in one place: blocking,
 * block symmetry across the two role-orderings a pair can hold, and the
 * open-conversation caps both sides are held to.
 */
import type { Doc, Id } from "../_generated/dataModel";

type Conversation = Doc<"xolacer_conversations">;
type ClosedReason = Conversation["closedReason"];

export type BlockPlanRow = Pick<
  Conversation,
  "_id" | "streamChannelId" | "closedReason"
>;
type RatingInputs = Pick<
  Conversation,
  "closedReason" | "acceptedAt" | "lastMessageAt"
>;

/**
 * What blocking this pair has to do — the whole decision, in one place, so the
 * pair-versus-row question cannot drift apart again.
 *
 * A block applies to the person, so both role-orderings are planned together:
 * every row the pair holds closes, and every channel those rows carry freezes.
 * A sibling still in `requested` closes too (no live invitation survives from
 * someone just blocked), and a sibling already closed for another reason has
 * its reason overwritten — `closedReason` is a gate input, not an audit log,
 * and a `declined` row would otherwise be re-requestable.
 *
 * - `noop` — either direction is already blocked, which means the whole pair
 *   is already down: nothing survives a block for the sibling to be reached
 *   through. Blocking twice is harmless, so a retry after a network failure
 *   must not error and must not make a second Stream call.
 * - `channelsToFreeze` — empty for a still-`requested` row, which has no Stream
 *   channel yet: only the row is written. Freezing is what actually stops a
 *   message; the client holds its own Stream token, so a Convex read gate only
 *   decides what the UI shows.
 */
export function planBlock(pair: {
  forward: BlockPlanRow | null | undefined;
  reverse: BlockPlanRow | null | undefined;
}): {
  noop: boolean;
  channelsToFreeze: string[];
  rowsToClose: Id<"xolacer_conversations">[];
} {
  if (isPairBlocked(pair.forward, pair.reverse))
    return { noop: true, channelsToFreeze: [], rowsToClose: [] };
  const rows = [pair.forward, pair.reverse].filter((row): row is BlockPlanRow =>
    Boolean(row),
  );
  return {
    noop: false,
    channelsToFreeze: rows
      .map((row) => row.streamChannelId)
      .filter((id): id is string => Boolean(id)),
    rowsToClose: rows.map((row) => row._id),
  };
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
