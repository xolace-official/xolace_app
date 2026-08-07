import { messageActions as defaultMessageActions } from 'stream-chat-expo';
import type {
  MessageActionsParams,
  MessageActionType,
  ReactionData,
} from 'stream-chat-expo';
import { ConversationMessageAuthor } from './message-author';
import { ChannelErrorIndicator } from './offline-strip';
import { ConversationTypingIndicator } from './typing-indicator';

// Everything that configures the Stream `<Channel>` in thread-messages.tsx.
// The message surface is text only: no thread replies, no quoted replies, no
// reactions. Stream provides all of them — the constraint is the deliberate
// "small surface" posture, not a capability gap. The typing indicator is the
// one live affordance added since.

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
};

/**
 * Everything except threadReply and quotedReply — v1 has no reply surface.
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
 * Gives iOS the portal settle window Stream only grants Android.
 *
 * Edit is the one action that focuses the composer input, and Stream gates that
 * focus behind `usePortalSettledCallback` — two frames on Android, **zero on
 * iOS**. With no window the focus lands while `PortalWhileClosingView` is still
 * handing the composer's native view back from the overlay's closing portal
 * host, and Stream's own doc comment predicts the result: "Doing this
 * prematurely will result in the keyboard being immediately closed." Observed
 * here as Edit silently doing nothing, and on iOS 26 as a hard abort inside JSI
 * (`Assertion failed: (isObject()), getObject`) when the focus command reached
 * a shadow node mid-reparent.
 *
 * Two frames reproduces the Android timing: one to let the portal retarget and
 * React commit, one to let the native hierarchy settle in its final host.
 * Remove once stream-chat-react-native ships a non-zero iOS SETTLE_FRAMES.
 */
function afterPortalSettles(action: () => void) {
  return () => requestAnimationFrame(() => requestAnimationFrame(action));
}

export function minimalMessageActions(
  params: MessageActionsParams,
): MessageActionType[] {
  return defaultMessageActions(params)
    .filter((action) => ALLOWED_ACTIONS.has(action.actionType))
    .map((action) =>
      process.env.EXPO_OS === 'ios' && action.actionType === 'editMessage'
        ? { ...action, action: afterPortalSettles(action.action) }
        : action,
    );
}
