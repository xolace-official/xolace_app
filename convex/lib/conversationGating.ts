/**
 * Every "may this conversation happen?" decision, in one place: blocking,
 * block symmetry across the two role-orderings a pair can hold, the
 * open-conversation caps both sides are held to, and the windows a request
 * lives and a decline rests for.
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
 * May this row tell one participant whether the other is in the app right now?
 *
 * Only while there is something to act on: a request awaiting an answer, or an
 * open thread. Presence is what turns "I'll get to this later" into "answer
 * this now, they're still here", and on a resting or closed row there is no
 * such move to make — all it would report is that someone who is no longer
 * talking to you has a mental health app open, which is never a fact this
 * product hands out for free.
 */
export function presenceDisclosed(status: Conversation["status"]): boolean {
  return status === "requested" || status === "open";
}

/**
 * How long a request waits for an answer before the sweep closes it.
 *
 * Two days, not a week: the median accept lands inside four hours and the 90th
 * percentile inside 32, so a request still unanswered after two days is not
 * going to be answered — it is only holding one of the seeker's pending slots
 * against something that will never happen.
 */
export const REQUEST_EXPIRY_MS = 48 * 60 * 60 * 1000;

/**
 * Has this request waited past the span? The sweep's whole age decision, out
 * here where it can be tested against the constant rather than a literal.
 */
export function hasRequestExpired(requestedAt: number, now: number): boolean {
  return now - requestedAt >= REQUEST_EXPIRY_MS;
}

/**
 * How long a declined pair waits before the seeker may ask that xolacer again.
 *
 * Declining frees the pending-request slot immediately, so without this the
 * same person can re-request in a loop — and every loop now reaches the
 * xolacer's lock screen. A day is long enough that a decline can't be pushed
 * through in an afternoon, short enough that someone who genuinely needs to
 * talk isn't held off a whole week by one person's no.
 *
 * A literal, and deliberately no longer derived from `REQUEST_EXPIRY_MS`. The
 * two answered to the same argument while a request lived a week, but they
 * measure different things — how long silence stays worth waiting on, versus
 * how long a refusal stays binding — and the second is the shorter of the two
 * once the first is measured in hours.
 *
 * Per pair, and for a decline only. A seeker turned down by several xolacers
 * hits nothing broader — someone reaching out repeatedly is who this app is
 * for, and a global cooldown would read as the app deciding they'd had enough.
 * An expiry carries no cooldown at all: silence is not a refusal, and treating
 * it as one penalises the seeker for their xolacer going quiet.
 */
export const DECLINE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type CooldownInputs = Pick<
  Conversation,
  "status" | "closedReason" | "declinedAt"
>;

/**
 * When this pair may request again, or undefined if they may now.
 *
 * Returns the moment the door reopens rather than a boolean, so one call
 * answers both the gate and the sentence the seeker reads — a refusal with no
 * date attached is the version of this that reads as punishment.
 *
 * Read off `declinedAt`, not `requestedAt`: a xolacer who declines on day six
 * of a week-old request would otherwise hand out an already-expired cooldown.
 * A row with no stamp predates the field and waits for nothing — the only
 * alternative is inventing a decline time.
 */
export function declineCooldownUntil(
  conversation: CooldownInputs | null | undefined,
  now: number,
): number | undefined {
  if (conversation?.status !== "closed") return undefined;
  if (conversation.closedReason !== "declined") return undefined;
  if (!conversation.declinedAt) return undefined;
  const until = conversation.declinedAt + DECLINE_COOLDOWN_MS;
  return until > now ? until : undefined;
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
