/**
 * The Stream app configuration as code: what the `messaging` channel type and
 * our blocklists should look like, and the pure diff that turns what Stream
 * currently returns into the PUT that gets there. `streamSetup.setup` reads,
 * plans, prints, and (on `--apply`) submits — this file never does I/O.
 *
 * The pre-delivery moderation lane lives here in its entirety (#344): Stream's
 * own regex/blocklist rules flag contact-sharing and URLs for dashboard review
 * without blocking or slowing a single message. Automod stays disabled and the
 * profanity list stays unattached — "I feel like shit" has to reach the person
 * listening.
 */

export type BlockListAttachment = { blocklist: string; behavior: string };

/** The fields of a channel type this plan reads or writes. Stream returns many
 * more; they are passed through untouched because the PUT only carries these. */
export type ChannelTypeConfig = {
  automod?: string;
  automod_behavior?: string;
  max_message_length?: number;
  skip_last_msg_update_for_system_msgs?: boolean;
  blocklists?: BlockListAttachment[];
  [key: string]: unknown;
};

export type BlockListConfig = { name: string; type: string; words: string[] };

/**
 * Regex rules, RE2 syntax (Stream's matcher — no lookaround). Each is one
 * "word" of a `type: "regex"` blocklist. Flagged, never blocked: a phone
 * number can be a step someone chose, and a human decides that, not a regex.
 */
export const CONTACT_LEAK_BLOCKLIST: BlockListConfig = {
  name: "contact_leak",
  type: "regex",
  words: [
    // Phone-number shapes: 9+ digits with optional +, spaces, dots, dashes, parens.
    String.raw`\+?\d[\d\s().-]{7,}\d`,
    // @handle
    String.raw`(^|\s)@[A-Za-z0-9_.]{3,}`,
    // Off-platform invitations. The unambiguous app names stand alone; the
    // short ones ("ig", "snap", "signal") are ordinary English and only count
    // as "my ig" / "on snap" / "via signal".
    String.raw`(?i)\b(whatsapp|telegram|snapchat|instagram|insta)\b`,
    String.raw`(?i)\b(my|on|via)\s+(ig|snap|signal)\b`,
  ],
};

export const DESIRED_MESSAGING = {
  // The resources card must not move the conversation up anyone's list.
  skip_last_msg_update_for_system_msgs: true,
  blocklists: [
    { blocklist: CONTACT_LEAK_BLOCKLIST.name, behavior: "flag" },
    // Stream's built-in URL regex list.
    { blocklist: "url_detection_v1", behavior: "flag" },
  ] as BlockListAttachment[],
};

export type DesiredMessaging = typeof DESIRED_MESSAGING;

export type ChannelTypePlan = {
  changes: Record<string, { from: unknown; to: unknown }>;
  /** The PUT body. Nested `blocklists` is resubmitted whole (Stream replaces,
   * never merges); the three fields the API marks required ride along. */
  body: ChannelTypeConfig;
};

const attachmentKey = (a: BlockListAttachment) => `${a.blocklist}:${a.behavior}`;

function sameAttachments(a: BlockListAttachment[], b: BlockListAttachment[]) {
  const left = a.map(attachmentKey).sort();
  const right = b.map(attachmentKey).sort();
  return left.length === right.length && left.every((k, i) => k === right[i]);
}

export function planChannelTypeUpdate(
  current: ChannelTypeConfig,
  desired: DesiredMessaging,
): ChannelTypePlan | null {
  const changes: ChannelTypePlan["changes"] = {};
  const body: ChannelTypeConfig = {
    automod: current.automod,
    automod_behavior: current.automod_behavior,
    max_message_length: current.max_message_length,
  };

  const key = "skip_last_msg_update_for_system_msgs";
  if (current[key] !== desired[key]) {
    changes[key] = { from: current[key], to: desired[key] };
    body[key] = desired[key];
  }

  const currentLists = current.blocklists ?? [];
  if (!sameAttachments(currentLists, desired.blocklists)) {
    changes.blocklists = { from: currentLists, to: desired.blocklists };
    body.blocklists = desired.blocklists;
  }

  return Object.keys(changes).length === 0 ? null : { changes, body };
}

export type BlockListPlan = { op: "create" } | { op: "update"; from: string[] };

export function planBlockList(
  existing: BlockListConfig | undefined,
  desired: BlockListConfig,
): BlockListPlan | null {
  if (!existing) return { op: "create" };
  const same =
    existing.words.length === desired.words.length &&
    existing.words.every((w, i) => w === desired.words[i]);
  return same ? null : { op: "update", from: existing.words };
}
