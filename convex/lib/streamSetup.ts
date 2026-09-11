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
 *
 * The lists attach through the Moderation v2 policy for the channel type
 * (`chat:messaging`, `block_list_config`), not the channel type's legacy
 * `blocklists` field — this app is on v2 and that field is inert here
 * (verified: a bare phone number sailed through with it set).
 */

/** The fields of a channel type this plan reads or writes. Stream returns many
 * more; they are passed through untouched because the PUT only carries these. */
export type ChannelTypeConfig = {
  automod?: string;
  automod_behavior?: string;
  max_message_length?: number;
  skip_last_msg_update_for_system_msgs?: boolean;
  [key: string]: unknown;
};

export type BlockListRule = { name: string; action: string };
export type BlockListPolicy = { enabled: boolean; rules: BlockListRule[] };

/** The v2 moderation policy fields this plan reads or writes. */
export type ModerationPolicy = {
  key: string;
  block_list_config?: BlockListPolicy | null;
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
};

export type DesiredMessaging = typeof DESIRED_MESSAGING;

/** The v2 policy key for the `messaging` channel type. */
export const MESSAGING_POLICY_KEY = "chat:messaging";

export const DESIRED_BLOCK_LIST_POLICY: BlockListPolicy = {
  enabled: true,
  rules: [
    { name: CONTACT_LEAK_BLOCKLIST.name, action: "flag" },
    // Stream's built-in URL regex list.
    { name: "url_detection_v1", action: "flag" },
  ],
};

export type ChannelTypePlan = {
  changes: Record<string, { from: unknown; to: unknown }>;
  /** The PUT body; the three fields the API marks required ride along. */
  body: ChannelTypeConfig;
};

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

  return Object.keys(changes).length === 0 ? null : { changes, body };
}

const ruleKey = (r: BlockListRule) => `${r.name}:${r.action}`;

/**
 * Order-insensitive compare of the policy's block-list rules. Returns the
 * upsert body or null when converged. Upsert REPLACES the policy (docs:
 * "If a configuration with the specified key already exists, it will be
 * replaced"), so every other engine's `*_config` rides along unchanged;
 * read-only fields (`created_at`, …) do not.
 */
export function planModerationPolicy(
  current: ModerationPolicy,
  desired: BlockListPolicy,
): { from: BlockListPolicy | null; body: ModerationPolicy } | null {
  const existing = current.block_list_config ?? null;
  const left = (existing?.rules ?? []).map(ruleKey).sort();
  const right = desired.rules.map(ruleKey).sort();
  const same =
    existing?.enabled === desired.enabled &&
    left.length === right.length &&
    left.every((k, i) => k === right[i]);
  if (same) return null;
  const body: ModerationPolicy = { key: current.key, block_list_config: desired };
  for (const [k, val] of Object.entries(current)) {
    if (k.endsWith("_config") && k !== "block_list_config" && val != null) body[k] = val;
  }
  return { from: existing, body };
}

export type BlockListPlan =
  | { op: "create" }
  | { op: "update"; from: string[] }
  /** Stream's update endpoint cannot change `type`; delete and create instead. */
  | { op: "recreate"; from: { type: string; words: string[] } };

export function planBlockList(
  existing: BlockListConfig | undefined,
  desired: BlockListConfig,
): BlockListPlan | null {
  if (!existing) return { op: "create" };
  if (existing.type !== desired.type) {
    return { op: "recreate", from: { type: existing.type, words: existing.words } };
  }
  const same =
    existing.words.length === desired.words.length &&
    existing.words.every((w, i) => w === desired.words[i]);
  return same ? null : { op: "update", from: existing.words };
}
