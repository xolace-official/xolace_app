import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import {
  addStreamChannelMembers,
  assignStreamChannelRole,
  createStreamBlockList,
  createStreamChannelType,
  createStreamRole,
  deleteStreamBlockList,
  getStreamChannelType,
  getStreamModerationPolicy,
  listStreamBlockLists,
  listStreamRoles,
  tryGetStreamChannelType,
  updateStreamBlockList,
  updateStreamChannelType,
  upsertStreamChannel,
  upsertStreamModerationPolicy,
  upsertStreamUsers,
} from "./integrations/stream";
import {
  CONTACT_LEAK_BLOCKLIST,
  DESIRED_BLOCK_LIST_POLICY,
  DESIRED_MESSAGING,
  DESIRED_XOLACE_BROADCAST,
  MESSAGING_POLICY_KEY,
  needsBroadcasterRole,
  planBlockList,
  planChannelTypeUpdate,
  planModerationPolicy,
  planXolaceBroadcastType,
  XOLACE_BROADCAST_CHANNEL_TYPE,
  XOLACE_BROADCASTER_ROLE,
  XOLACE_CHANNEL_ID,
  type ChannelTypeConfig,
  type ModerationPolicy,
  type XolaceBroadcastConfig,
} from "./lib/streamSetup";

/**
 * The Stream app configuration as code — sibling of `stream:webhook`.
 *
 *   bun stream:setup                 # dev, diff only
 *   bun stream:setup '{"apply":true}'
 *   bun stream:setup:prod            # then the same with apply
 *
 * Reads the `messaging` channel type and the blocklists, computes the desired
 * state (`lib/streamSetup`), prints the diff, and applies only on `apply`.
 * Each environment is a separate Stream app, so run it per environment, dev
 * first. The plan is tested against the dev app's real JSON; this action is
 * the thin I/O around it.
 */
export const setup = internalAction({
  args: { apply: v.optional(v.boolean()) },
  returns: v.object({ applied: v.boolean(), changes: v.array(v.string()) }),
  handler: async (_ctx, { apply = false }) => {
    const changes: string[] = [];

    const lists = await listStreamBlockLists();
    const existing = lists.find((l) => l.name === CONTACT_LEAK_BLOCKLIST.name);
    const listPlan = planBlockList(
      existing ? { name: existing.name, type: existing.type ?? "", words: existing.words } : undefined,
      CONTACT_LEAK_BLOCKLIST,
    );
    if (listPlan) {
      changes.push(`blocklist ${CONTACT_LEAK_BLOCKLIST.name}: ${JSON.stringify(listPlan)}`);
      if (apply) {
        if (listPlan.op === "recreate") await deleteStreamBlockList(CONTACT_LEAK_BLOCKLIST.name);
        if (listPlan.op !== "update") await createStreamBlockList(CONTACT_LEAK_BLOCKLIST);
        else await updateStreamBlockList(CONTACT_LEAK_BLOCKLIST.name, CONTACT_LEAK_BLOCKLIST.words);
      }
    }

    const current = (await getStreamChannelType("messaging")) as ChannelTypeConfig;
    const plan = planChannelTypeUpdate(current, DESIRED_MESSAGING);
    if (plan) {
      for (const [key, diff] of Object.entries(plan.changes)) {
        changes.push(`messaging.${key}: ${JSON.stringify(diff.from)} → ${JSON.stringify(diff.to)}`);
      }
      if (apply) await updateStreamChannelType("messaging", plan.body);
    }

    const policy = (await getStreamModerationPolicy(MESSAGING_POLICY_KEY)) as ModerationPolicy;
    const policyPlan = planModerationPolicy(policy, DESIRED_BLOCK_LIST_POLICY);
    if (policyPlan) {
      changes.push(
        `${MESSAGING_POLICY_KEY}.block_list_config: ${JSON.stringify(policyPlan.from)} → ${JSON.stringify(DESIRED_BLOCK_LIST_POLICY)}`,
      );
      // After the blocklist exists — a name Stream has never seen is rejected.
      if (apply) await upsertStreamModerationPolicy(policyPlan.body);
    }

    // --- xolace-broadcast channel type (#373) ---
    // The role must be registered before it can appear as a `grants` key below.
    const existingRoles = await listStreamRoles();
    if (needsBroadcasterRole(existingRoles)) {
      changes.push(`role ${XOLACE_BROADCASTER_ROLE}: create`);
      if (apply) await createStreamRole(XOLACE_BROADCASTER_ROLE);
    }

    const currentBroadcast = (await tryGetStreamChannelType(
      XOLACE_BROADCAST_CHANNEL_TYPE,
    )) as XolaceBroadcastConfig | null;
    const broadcastPlan = planXolaceBroadcastType(currentBroadcast, DESIRED_XOLACE_BROADCAST);
    if (broadcastPlan) {
      if (broadcastPlan.op === "create") {
        changes.push(`${XOLACE_BROADCAST_CHANNEL_TYPE}: create ${JSON.stringify(broadcastPlan.body)}`);
        if (apply) await createStreamChannelType(broadcastPlan.body);
      } else {
        for (const [key, diff] of Object.entries(broadcastPlan.changes)) {
          changes.push(
            `${XOLACE_BROADCAST_CHANNEL_TYPE}.${key}: ${JSON.stringify(diff.from)} → ${JSON.stringify(diff.to)}`,
          );
        }
        if (apply) await updateStreamChannelType(XOLACE_BROADCAST_CHANNEL_TYPE, broadcastPlan.body);
      }
    }

    for (const line of changes) console.log(line);
    if (changes.length === 0) console.log("Stream app already matches desired state");
    else if (!apply) console.log("Dry run — pass {\"apply\":true} to apply");
    return { applied: apply && changes.length > 0, changes };
  },
});

/**
 * One-off (#373): creates the fixed Xolace singleton channel and grants its one designated
 * sender — the real Xolace-email `users` row, identified here by its `emotionalProfileId`
 * (the existing convention for keying a Stream user, same as every other profile) — the
 * `XOLACE_BROADCASTER_ROLE`. The id is taken as an explicit argument rather than looked up:
 * `users` deliberately stores no email (see `schema.ts`), so there is no way to find "the real
 * Xolace account" from inside Convex — the caller supplies the profile id of the account that
 * already signed up through normal onboarding. Explicitly distinct from `XOLACE_SYSTEM_USER_ID`
 * (the crisis-resource pseudo-user in `integrations/stream.ts`) — this action never touches it.
 *
 * Run once per environment, after `stream:setup` has created the `xolace-broadcast` channel
 * type and role — dev first:
 *
 *   convex run streamSetup:createXolaceChannel '{"senderProfileId":"<emotional_profiles id>"}'
 */
export const createXolaceChannel = internalAction({
  args: {
    senderProfileId: v.id("emotional_profiles"),
    senderDisplayName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (_ctx, { senderProfileId, senderDisplayName }) => {
    const name = senderDisplayName ?? "Xolace Inc";
    await upsertStreamUsers([{ id: senderProfileId, name }]);
    await upsertStreamChannel(XOLACE_BROADCAST_CHANNEL_TYPE, XOLACE_CHANNEL_ID, {
      members: [senderProfileId],
      createdById: senderProfileId,
    });
    await assignStreamChannelRole(XOLACE_BROADCAST_CHANNEL_TYPE, XOLACE_CHANNEL_ID, [
      { userId: senderProfileId, channelRole: XOLACE_BROADCASTER_ROLE },
    ]);
    console.log(
      `Xolace channel "${XOLACE_CHANNEL_ID}" ready; ${senderProfileId} granted ${XOLACE_BROADCASTER_ROLE}`,
    );
    return null;
  },
});

/**
 * Universal membership (#374): every camper is a member of the fixed Xolace
 * channel. Scheduled best-effort from `users.getOrCreate` — a signup or
 * reactivation should never fail on a Stream hiccup, and a member who didn't
 * make it in this time gets picked up by the next backfill run.
 */
export const addToXolaceChannel = internalAction({
  args: { profileId: v.id("emotional_profiles") },
  returns: v.null(),
  handler: async (_ctx, { profileId }) => {
    try {
      await addStreamChannelMembers(XOLACE_BROADCAST_CHANNEL_TYPE, XOLACE_CHANNEL_ID, [
        profileId,
      ]);
    } catch (error) {
      console.warn("[xolace-channel] addStreamChannelMembers failed", error);
    }
    return null;
  },
});

/**
 * One-off backfill (#374): adds every existing `emotional_profiles` row as a
 * member of the fixed Xolace channel. Safe to re-run — Stream's `add_members`
 * no-ops for an id that's already a member — and safe to run mid-signup-traffic
 * since new signups add themselves via `addToXolaceChannel`. Paginates through
 * the whole table in one invocation, 500 ids per Stream call:
 *
 *   convex run streamSetup:backfillXolaceChannelMembership
 */
export const backfillXolaceChannelMembership = internalAction({
  args: {},
  returns: v.object({ added: v.number() }),
  handler: async (ctx): Promise<{ added: number }> => {
    let cursor: string | null = null;
    let added = 0;
    for (;;) {
      const page: {
        profileIds: string[];
        continueCursor: string;
        isDone: boolean;
      } = await ctx.runQuery(internal.streamSetup.listProfileIdsPage, { cursor });

      if (page.profileIds.length > 0) {
        await addStreamChannelMembers(
          XOLACE_BROADCAST_CHANNEL_TYPE,
          XOLACE_CHANNEL_ID,
          page.profileIds,
        );
        added += page.profileIds.length;
      }

      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    console.log(`Backfilled ${added} Xolace channel member(s)`);
    return { added };
  },
});

export const listProfileIdsPage = internalQuery({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({
    profileIds: v.array(v.string()),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, { cursor }) => {
    const result = await ctx.db
      .query("emotional_profiles")
      .paginate({ numItems: 500, cursor });
    return {
      profileIds: result.page.map((p) => p._id),
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});
