import { v } from "convex/values";
import type Anthropic from "@anthropic-ai/sdk";
import {
  WorkflowManager,
  vWorkflowId,
  vResultValidator,
} from "@convex-dev/workflow";
import { components, internal } from "../../_generated/api";
import { internalAction, internalMutation } from "../../_generated/server";
import { posthog } from "../../posthog";
import {
  getAnthropicClient,
  REFLECTION_CONSOLIDATION_MODEL,
  REFLECTION_CONSOLIDATION_VERSION,
} from "../providers/anthropic";
import { buildConsolidationSystemPrompt } from "../prompts/reflectionConsolidation";
import { REFLECTION_TOOLS, WRITE_TOOL, dispatchTool } from "./tools";

// =============================================================
// Reflection Agent — CONSOLIDATION PASS (Cognition Layer Phase 3).
//
// The deep, agentic "slow mind": a durable single-step workflow wrapping the
// custom Sonnet tool-use loop (decision-log #6 — custom loop on workflow for
// durable retry, minimal surface). The loop gathers evidence via read tools
// and commits ONE new profile version through update_profile_section.
//
// Fresh WorkflowManager on the shared component (multiple managers supported,
// same pattern as followUps.ts). The SDK + rag.search are fetch-based, so the
// loop runs WITHOUT "use node".
// =============================================================

export const workflow = new WorkflowManager(components.workflow);

// Cap the loop so a misbehaving model can never spin. Generous: a well-behaved
// pass reads a handful of tools then writes once.
const MAX_ITERATIONS = 8;
const MAX_TOKENS = 2048;

export const consolidationWorkflow = workflow.define({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (step, args): Promise<void> => {
    const wroteProfile: boolean = await step.runAction(
      internal.ai.reflectionAgent.consolidation.runConsolidation,
      { emotionalProfileId: args.emotionalProfileId },
      // Durable retry is the whole point of hosting this on a workflow.
      { retry: true },
    );
    // Post-write side effects live in their own journaled step: once the
    // action step has committed, a failure here retries only the mutation —
    // it can never rerun the model loop and append a duplicate version.
    if (wroteProfile) {
      await step.runMutation(
        internal.ai.reflectionAgent.consolidation.markConsolidated,
        { emotionalProfileId: args.emotionalProfileId },
      );
    }

    // Tone adaptation (Phase 4, Loop #1). Deterministic — runs regardless of
    // whether the agent wrote a narrative version, and after it, so the "what
    // lands" section patches onto the now-current version. Own journaled step:
    // cheap, idempotent, and never reruns the model loop on retry.
    await step.runMutation(
      internal.ai.reflectionAgent.calibration.refreshCalibration,
      { emotionalProfileId: args.emotionalProfileId },
    );
  },
});

/**
 * The custom tool-use loop. Runs the consolidation to terminal write and
 * reports whether it wrote; the workflow stamps lastConsolidationAt in a
 * separate step so a post-write failure can't retry the loop. Best-effort
 * throughout — this is off the critical path; a failure retries via the
 * workflow and never touches a live mirror.
 */
export const runConsolidation = internalAction({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const anthropic = getAnthropicClient();
    const system = buildConsolidationSystemPrompt();

    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content:
          "Consolidate this person's emotional profile. Read the current profile first, gather evidence with the read tools, then write the new version once.",
      },
    ];

    let wroteProfile = false;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: REFLECTION_CONSOLIDATION_MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: REFLECTION_TOOLS,
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        if (block.name === WRITE_TOOL) wroteProfile = true;
        const result = await dispatchTool(
          ctx,
          args.emotionalProfileId,
          block.name,
          block.input as Record<string, unknown>,
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }

      messages.push({ role: "user", content: toolResults });

      // Terminal write done — the profile is committed; stop the loop.
      if (wroteProfile) break;
    }

    if (!wroteProfile) {
      console.warn("[reflectionConsolidation] loop ended without a write", {
        emotionalProfileId: args.emotionalProfileId,
      });
    }
    return wroteProfile;
  },
});

/** Anchor the gate: the consolidation just ran. */
export const markConsolidated = internalMutation({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    // Skip if a wipe swept the profile mid-flight (mirrors the write guard).
    const profile = await ctx.db.get(args.emotionalProfileId);
    if (!profile || profile.dataWipeInProgress === true) return null;
    await ctx.db.patch(args.emotionalProfileId, {
      lastConsolidationAt: Date.now(),
    });
    await posthog.capture(ctx, {
      distinctId: args.emotionalProfileId,
      event: "reflect_consolidation_written",
      properties: { writerVersion: REFLECTION_CONSOLIDATION_VERSION },
    });
    return null;
  },
});

/** Component onComplete hook — purge the workflow's journal tables. */
export const onConsolidationComplete = internalMutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.any(),
  },
  handler: async (ctx, args) => {
    await workflow.cleanup(ctx, args.workflowId);
    return null;
  },
});
