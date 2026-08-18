import { messageActions as defaultMessageActions } from 'stream-chat-expo';
import type {
  MessageActionsParams,
  MessageActionType,
  ReactionData,
} from 'stream-chat-expo';
import { ConversationMessageAuthor } from './message-author';
import { ChannelErrorIndicator } from './offline-strip';
import { ConversationReply } from './quoted-reply';
import { ConversationTypingIndicator } from './typing-indicator';

// Everything that configures the Stream `<Channel>` in thread-messages.tsx.
// The message surface is text only: no thread replies, no reactions. Stream
// provides them — the constraint is the deliberate "small surface" posture,
// not a capability gap. The typing indicator and quoted replies (via the SDK's
// swipe gesture) are the live affordances added since.

export const NO_REACTIONS: ReactionData[] = [];

/**
 * Removes the two affordances v1 has no answer for.
 *
 * `supportedReactions: []` only empties the reaction *list* — the picker itself
 * renders on `own_capabilities.sendReaction`, so long-press still offered a bare
 * "+" that opened an emoji sheet. And the composer's "+" is an attachment
 * picker; we accept text only, so it opened a gallery whose result had nowhere
 * to go. Denying the capability is the single lever for both: the reaction
 * picker returns null on `sendReaction`, and the attach button on `uploadFile`.
 *
 * Capabilities are merged per-key, so naming these two leaves the rest of the
 * channel's real capabilities intact.
 */
export const TEXT_ONLY_CAPABILITIES = { sendReaction: false, uploadFile: false };

/**
 * Bounds the channel's height so the composer stays on screen.
 *
 * `Channel`'s root is a `KeyboardCompatibleView` that it renders with no style
 * of its own — a plain View, height `auto` — and its only child is
 * `<View style={{ height: '100%' }}>`. A percentage height resolves to `auto`
 * inside an auto-height parent, so the whole column ends up unbounded: the
 * message list's `flex: 1` has no free space to divide and grows to its own
 * content height instead, and the composer is pushed however far past the
 * bottom edge that content runs. Short threads fit and look fine; a thread with
 * history pushes the composer clean off the screen.
 *
 * `flex: 1` here is the only place a definite height can enter — the prop is
 * spread last, so this is the style the view actually renders with.
 */
export const CHANNEL_ROOT_PROPS = { style: { flex: 1 } };

/**
 * Hands the offline half of Stream's indicator to OfflineStrip — see there —
 * the per-message avatar to ConversationMessageAuthor, and the typing
 * indicator to ConversationTypingIndicator, so identity everywhere comes from
 * the conversation rather than Stream's globally-shared, mutable user record.
 *
 * **The rule for anything added here:** any Stream component that renders a
 * user's name or image must be overridden with conversation-sourced identity.
 * The Stream user record is deliberately pseudonymous for everyone (see
 * `upsertStreamUsers` server-side), so it is never the right thing to show a
 * seeker — and it is one record per person, so it can't be. That still covers
 * read receipts and anything else that grows an avatar: enabling one without
 * an override leaks the wrong identity by default.
 *
 * **Registering the override is only half of it.** The other half is where the
 * override sources its answer: it must ask `resolveMessageIdentity` whether
 * the sender *is* the counterpart, and take the name it returns. An override
 * that decides for itself — typically by asking whether the sender is someone
 * other than the local user — reintroduces the exact leak this map exists to
 * close, one file further down.
 */
export const COMPONENT_OVERRIDES = {
  NetworkDownIndicator: ChannelErrorIndicator,
  MessageAuthor: ConversationMessageAuthor,
  TypingIndicator: ConversationTypingIndicator,
  Reply: ConversationReply,
};

/**
 * Everything except threadReply and quotedReply.
 *
 * Dropping `quotedReply` here does *not* remove quoted replies: the SDK's
 * swipe-to-reply gesture (`enableSwipeToReply`, on by default) reaches
 * `handleQuotedReply` without consulting this list, so the surface exists and
 * ships. Its preview is identity-corrected by `ConversationReply` below.
 *
 * Subtractive on purpose. Building the array by hand skipped Stream's own
 * gating and offered actions that cannot run: Copy with no clipboard handler
 * registered, Retry on a message that never failed, Flag on your own message.
 */
const ALLOWED_ACTIONS = new Set([
  'copyMessage',
  'editMessage',
  'deleteMessage',
  'flagMessage',
  'retry',
]);

/**
 * Edit used to be wrapped here in a two-frame `requestAnimationFrame` delay on
 * iOS, because Stream's `usePortalSettledCallback` waits two frames on Android
 * and **zero** on iOS, and Edit is the one action that focuses the composer.
 *
 * The symptom that wrapper was written for — Edit silently doing nothing — was
 * actually the broken clipboard handler in stream-chat-expo < 9.7.3 poisoning
 * the overlay's action queue (see docs/bug-log.md, 2026-08-17). With that fixed,
 * Edit was verified working on iOS 26 without the delay: cold, and immediately
 * after a Copy tap. Stream's own `useAfterKeyboardOpenCallback` already holds
 * `setEditingState` until the composer's keyboard event lands, which is the
 * window that actually matters.
 *
 * If Edit ever regresses on iOS — keyboard flashing shut on open, or a JSI
 * abort (`Assertion failed: (isObject()), getObject`) from a focus command
 * reaching a shadow node mid-reparent — that delay is the thing to reinstate.
 */
export function minimalMessageActions(
  params: MessageActionsParams,
): MessageActionType[] {
  return defaultMessageActions(params).filter((action) =>
    ALLOWED_ACTIONS.has(action.actionType),
  );
}
