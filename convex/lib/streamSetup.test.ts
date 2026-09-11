/**
 * `planChannelTypeUpdate` against the dev app's `messaging` channel type as
 * captured on 2026-09-11 (`getstream api GetChannelType --name messaging`,
 * permissions/grants/commands elided — the plan never touches them).
 */
import { describe, expect, it } from "vitest";
import {
  DESIRED_BLOCK_LIST_POLICY,
  DESIRED_MESSAGING,
  planBlockList,
  planChannelTypeUpdate,
  planModerationPolicy,
} from "./streamSetup";

const DEV_MESSAGING_2026_09_11 = {
  automod: "disabled",
  automod_behavior: "flag",
  connect_events: true,
  count_messages: false,
  custom_events: true,
  delivery_events: true,
  mark_messages_pending: false,
  max_message_length: 5000,
  message_retention: "infinite",
  mutes: true,
  name: "messaging",
  polls: false,
  push_level: "all",
  push_notifications: true,
  quotes: true,
  reactions: true,
  read_events: true,
  reminders: false,
  replies: true,
  search: true,
  shared_locations: false,
  skip_last_msg_update_for_system_msgs: false,
  typing_events: true,
  uploads: true,
  url_enrichment: true,
  user_message_reminders: false,
};

describe("planChannelTypeUpdate", () => {
  it("turns the fresh dev app into the desired state in one PUT", () => {
    const plan = planChannelTypeUpdate(DEV_MESSAGING_2026_09_11, DESIRED_MESSAGING);
    expect(plan).not.toBeNull();
    expect(plan!.changes).toEqual({
      skip_last_msg_update_for_system_msgs: { from: false, to: true },
    });
    // The three the API marks required ride along unchanged; automod stays
    // disabled and the profanity list stays unattached.
    expect(plan!.body).toEqual({
      automod: "disabled",
      automod_behavior: "flag",
      max_message_length: 5000,
      skip_last_msg_update_for_system_msgs: true,
    });
  });

  it("is a no-op once applied", () => {
    const applied = { ...DEV_MESSAGING_2026_09_11, skip_last_msg_update_for_system_msgs: true };
    expect(planChannelTypeUpdate(applied, DESIRED_MESSAGING)).toBeNull();
  });
});

/** `getstream api GetConfig --key chat:messaging`, dev, 2026-09-11 — the
 * dashboard-seeded default: an LLM policy present but disabled, no lists. */
const DEV_POLICY_2026_09_11 = {
  key: "chat:messaging",
  team: "",
  async: false,
  automod_toxicity_config: null,
  block_list_config: null,
  ai_text_config: null,
  llm_config: { async: false, enabled: false, rules: [{ label: "SCAM", action: "" }] },
  created_at: 1789100358665493000,
  updated_at: 1789100358665493000,
};

describe("planModerationPolicy", () => {
  it("attaches both lists and carries the other engines' configs along, not the read-only fields", () => {
    const plan = planModerationPolicy(DEV_POLICY_2026_09_11, DESIRED_BLOCK_LIST_POLICY);
    expect(plan).toEqual({
      from: null,
      body: {
        key: "chat:messaging",
        block_list_config: DESIRED_BLOCK_LIST_POLICY,
        llm_config: DEV_POLICY_2026_09_11.llm_config,
      },
    });
  });

  it("is a no-op once applied, whatever order Stream returns the rules in", () => {
    const applied = {
      ...DEV_POLICY_2026_09_11,
      block_list_config: {
        enabled: true,
        rules: [
          { name: "url_detection_v1", action: "flag" },
          { name: "contact_leak", action: "flag" },
        ],
      },
    };
    expect(planModerationPolicy(applied, DESIRED_BLOCK_LIST_POLICY)).toBeNull();
  });

  it("a rule set by hand to remove is corrected", () => {
    const drifted = {
      ...DEV_POLICY_2026_09_11,
      block_list_config: {
        enabled: true,
        rules: [
          { name: "contact_leak", action: "remove" },
          { name: "url_detection_v1", action: "flag" },
        ],
      },
    };
    const plan = planModerationPolicy(drifted, DESIRED_BLOCK_LIST_POLICY);
    expect(plan!.from).toEqual(drifted.block_list_config);
    expect(plan!.body.block_list_config).toEqual(DESIRED_BLOCK_LIST_POLICY);
  });
});

describe("planBlockList", () => {
  const desired = { name: "contact_leak", type: "regex", words: ["a", "b"] };

  it("creates when absent", () => {
    expect(planBlockList(undefined, desired)).toEqual({ op: "create" });
  });

  it("updates when the patterns drifted", () => {
    expect(planBlockList({ ...desired, words: ["a"] }, desired)).toEqual({
      op: "update",
      from: ["a"],
    });
  });

  it("recreates when the words match but the type drifted", () => {
    expect(planBlockList({ ...desired, type: "word" }, desired)).toEqual({
      op: "recreate",
      from: { type: "word", words: ["a", "b"] },
    });
  });

  it("is a no-op when identical", () => {
    expect(planBlockList({ ...desired }, desired)).toBeNull();
  });
});
