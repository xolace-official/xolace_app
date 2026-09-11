/**
 * `planChannelTypeUpdate` against the dev app's `messaging` channel type as
 * captured on 2026-09-11 (`getstream api GetChannelType --name messaging`,
 * permissions/grants/commands elided — the plan never touches them).
 */
import { describe, expect, it } from "vitest";
import {
  DESIRED_MESSAGING,
  planBlockList,
  planChannelTypeUpdate,
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
      blocklists: {
        from: [],
        to: [
          { blocklist: "contact_leak", behavior: "flag" },
          { blocklist: "url_detection_v1", behavior: "flag" },
        ],
      },
    });
    // The three the API marks required ride along unchanged; automod stays
    // disabled and the profanity list stays unattached.
    expect(plan!.body).toEqual({
      automod: "disabled",
      automod_behavior: "flag",
      max_message_length: 5000,
      skip_last_msg_update_for_system_msgs: true,
      blocklists: DESIRED_MESSAGING.blocklists,
    });
  });

  it("is a no-op once applied, whatever order Stream returns the blocklists in", () => {
    const applied = {
      ...DEV_MESSAGING_2026_09_11,
      skip_last_msg_update_for_system_msgs: true,
      blocklists: [
        { blocklist: "url_detection_v1", behavior: "flag" },
        { blocklist: "contact_leak", behavior: "flag" },
      ],
    };
    expect(planChannelTypeUpdate(applied, DESIRED_MESSAGING)).toBeNull();
  });

  it("a blocklist attached by hand with the wrong behavior is corrected, not duplicated", () => {
    const drifted = {
      ...DEV_MESSAGING_2026_09_11,
      skip_last_msg_update_for_system_msgs: true,
      blocklists: [
        { blocklist: "contact_leak", behavior: "block" },
        { blocklist: "url_detection_v1", behavior: "flag" },
      ],
    };
    const plan = planChannelTypeUpdate(drifted, DESIRED_MESSAGING);
    expect(Object.keys(plan!.changes)).toEqual(["blocklists"]);
    expect(plan!.body.blocklists).toEqual(DESIRED_MESSAGING.blocklists);
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

  it("is a no-op when identical", () => {
    expect(planBlockList({ ...desired }, desired)).toBeNull();
  });
});
