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
export type ChatNotificationType = "chat_request";

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
 * Where tapping lands. The request lands on the Connect tab, which auto-selects
 * Chats whenever a conversation exists — and a request notification is proof
 * one does.
 */
const ROUTES = {
  chat_request: "/connect",
} as const satisfies Record<ChatNotificationType, string>;

export function chatNotificationRoute(type: ChatNotificationType) {
  return ROUTES[type];
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
 */
export function chatNotificationContent(
  type: ChatNotificationType,
  counterpartName: string,
): ChatNotificationContent {
  switch (type) {
    case "chat_request":
      return { title: counterpartName, body: CHAT_REQUEST_SUBTITLE };
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
