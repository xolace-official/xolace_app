import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import {
  createStreamBlockList,
  getStreamChannelType,
  getStreamModerationPolicy,
  listStreamBlockLists,
  updateStreamBlockList,
  updateStreamChannelType,
  upsertStreamModerationPolicy,
} from "./integrations/stream";
import {
  CONTACT_LEAK_BLOCKLIST,
  DESIRED_BLOCK_LIST_POLICY,
  DESIRED_MESSAGING,
  MESSAGING_POLICY_KEY,
  planBlockList,
  planChannelTypeUpdate,
  planModerationPolicy,
  type ChannelTypeConfig,
  type ModerationPolicy,
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
        if (listPlan.op === "create") await createStreamBlockList(CONTACT_LEAK_BLOCKLIST);
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

    for (const line of changes) console.log(line);
    if (changes.length === 0) console.log("Stream app already matches desired state");
    else if (!apply) console.log("Dry run — pass {\"apply\":true} to apply");
    return { applied: apply && changes.length > 0, changes };
  },
});
