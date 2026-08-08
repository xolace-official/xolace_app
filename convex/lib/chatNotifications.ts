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
  | "chat_declined";

const TYPES: ChatNotificationType[] = [
  "chat_request",
  "chat_accepted",
  "chat_declined",
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
  }
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
