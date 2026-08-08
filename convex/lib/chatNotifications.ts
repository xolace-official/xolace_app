/**
 * Every decision a conversation notification makes that isn't I/O: whether the
 * user's preferences allow one, and what the notification says and opens.
 *
 * Conversation notifications are transactional, not nudges. They skip the
 * Quiet Window, the nudge rate bucket, and `notification_log` — a person
 * waiting on you is not a 9am-appropriate marketing touch — so the only
 * suppression left is the master switch and the chat preference, both here.
 */

/**
 * Notification types, as they travel in the push `data` payload. Prefixed so
 * the client's tap handler can tell them apart from the AI-nudge types, which
 * share that field.
 */
export type ChatNotificationType =
  | "chat_request"
  | "chat_accepted"
  | "chat_declined"
  | "chat_message";

const TYPES: ChatNotificationType[] = [
  "chat_request",
  "chat_accepted",
  "chat_declined",
  "chat_message",
];

/** Narrows the `type` field off a push payload, which arrives untyped. */
export function isChatNotificationType(
  value: unknown,
): value is ChatNotificationType {
  return TYPES.includes(value as ChatNotificationType);
}

export type ChatNotificationContent = {
  title: string;
  body: string;
};

/**
 * The chats list already says this for a pending request. Both surfaces read
 * it from here so a reword cannot leave the notification describing the same
 * event in different words.
 */
export const CHAT_REQUEST_SUBTITLE = "Wants to talk, accept when you have space";

/**
 * Where tapping lands.
 *
 * An accept lands in the thread itself, so the seeker can start writing
 * without hunting for the row. The other two land on the Connect tab, and both
 * name their segment rather than relying on its auto-select: that tab stays
 * mounted for the life of the app and remembers the last segment the user
 * touched, so a xolacer browsing the roster would otherwise never see the
 * request they just tapped, and a seeker would be dropped back on the
 * conversation that just closed.
 *
 * `tappedAt` is what makes a repeat arrival land: identical params look like
 * no navigation at all to a screen that is already mounted.
 */
export function chatNotificationRoute(
  type: ChatNotificationType,
  conversationId: string,
  tappedAt: number,
) {
  switch (type) {
    case "chat_request":
      return {
        pathname: "/connect",
        params: { view: "chats", t: String(tappedAt) },
      } as const;
    case "chat_accepted":
    case "chat_message":
      return {
        pathname: "/chat/[conversationId]",
        params: { conversationId },
      } as const;
    case "chat_declined":
      return {
        pathname: "/connect",
        params: { view: "xolacers", t: String(tappedAt) },
      } as const;
  }
}

/**
 * Title and body for one event.
 *
 * The pseudonym goes in the **title**, not the body: Expo's push API exposes no
 * collapse key, Android tag, or iOS thread-id, so the title is the only field
 * that keeps two simultaneous requests apart on a lock screen. Nothing anyone
 * wrote ever reaches either field.
 *
 * The request body is the exact wording the chats list already shows for this
 * event, so the notification reads as the same event rather than a second one.
 *
 * Declined is the one exception to pseudonym-as-title: naming the person who
 * turned you down in bold on a lock screen is where that rule works against
 * the user. Its body ends on an option rather than on the rejection.
 */
export function chatNotificationContent(
  type: ChatNotificationType,
  counterpartName: string = "Xolace",
): ChatNotificationContent {
  switch (type) {
    case "chat_request":
      return { title: counterpartName, body: CHAT_REQUEST_SUBTITLE };
    case "chat_accepted":
      return {
        title: counterpartName,
        body: "Has space for you, your conversation is open",
      };
    case "chat_declined":
      return {
        title: "Xolace",
        body: "That conversation didn't open. Other xolacers are available.",
      };
    case "chat_message":
      return { title: counterpartName, body: "Sent you a message" };
  }
}

// ============================================================
// Message notifications (Stream `message.new` webhook)
// ============================================================

/**
 * The Stream channel id for a conversation — deterministic per row, which is
 * what makes an accept retry idempotent, and what lets the webhook find its
 * way back to our row without a second Stream call.
 */
const CHANNEL_ID_PREFIX = "xolacer_";

export function xolacerChannelId(conversationId: string): string {
  return `${CHANNEL_ID_PREFIX}${conversationId}`;
}

/**
 * The inverse, applied to whatever the webhook claims the channel is. Returns
 * the raw id string only — the caller still has to check it names a real row,
 * because a forged payload can put any text after the prefix.
 */
export function conversationIdFromChannelId(
  channelId: unknown,
): string | null {
  if (typeof channelId !== "string") return null;
  if (!channelId.startsWith(CHANNEL_ID_PREFIX)) return null;
  const id = channelId.slice(CHANNEL_ID_PREFIX.length);
  return id.length > 0 ? id : null;
}

/**
 * Who gets told about a message, derived from **our** conversation row rather
 * than from the webhook's member list.
 *
 * Two things fall out of that for free: the sender can never be the recipient,
 * and a payload naming a sender who is not on this row addresses nobody at all
 * — so a forged event cannot push a notification at an arbitrary profile.
 */
export function messageNotificationRecipient<T extends string>(
  conversation: { userProfileId: T; xolacerProfileId: T },
  senderId: unknown,
): T | null {
  if (senderId === conversation.userProfileId) {
    return conversation.xolacerProfileId;
  }
  if (senderId === conversation.xolacerProfileId) {
    return conversation.userProfileId;
  }
  return null;
}

/**
 * One notification per conversation per two minutes. Someone typing four
 * thoughts in a row is one arrival, not four buzzes.
 *
 * Dropped rather than batched: there is nothing to batch, since the body never
 * carries content. Keyed on the conversation and not on the recipient, so a
 * second person messaging you in a different thread always gets through — the
 * suppression can quiet a chatty friend, never hide a stranger.
 */
export const MESSAGE_NOTIFICATION_WINDOW_MS = 2 * 60 * 1000;

export function messageNotificationSuppressed(
  lastNotifiedAt: number | undefined,
  now: number,
): boolean {
  if (lastNotifiedAt === undefined) return false;
  return now - lastNotifiedAt < MESSAGE_NOTIFICATION_WINDOW_MS;
}

/**
 * May we send this person a conversation notification?
 *
 * `chat` is absent on every row written before it existed, and absent means
 * enabled — the feature has to work for users who never see a new toggle.
 * A missing preferences row is nobody who ever turned notifications on.
 */
export function chatNotificationsAllowed(
  notifications: { enabled: boolean; chat?: boolean } | null | undefined,
): boolean {
  if (!notifications) return false;
  return notifications.enabled && notifications.chat !== false;
}
