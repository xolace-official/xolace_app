import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { DOMAINS } from "../../lib/understandingVocab";
import {
  DIRECTIONS,
  INSIGHT_KINDS,
  type InsightDraft,
  type InsightKind,
} from "../../compounding/insightGate";

// =============================================================
// Reflection Agent — STEADINESS INSIGHT TOOLS (#525, ADR 0019).
//
// get_domain_steadiness hands the agent the counted facts and the citable
// sessions; write_insight goes through compounding/insightStore.save, which
// rebuilds the evidence itself and runs the quality gate before storing.
// =============================================================

/** Xolace+ with personal memory on only: the steadiness-insight pair (#525). */
export const INSIGHT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_domain_steadiness",
    description:
      "Counted facts per part of their life (steadiness, their usual, the week's move, whether it's compounding and which linked domains slipped first) and every session you may cite, with its id, when it happened in their week, their own words, what they chose, how it sat afterwards and their later check-in. Read this before write_insight.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "write_insight",
    description:
      "Save one steadiness insight. Checked by code before it's kept; a rejection tells you why, so you can fix it or drop it. At most 4 per run, one per kind per domain.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: [...INSIGHT_KINDS] },
        domains: {
          type: "array",
          items: { type: "string", enum: [...DOMAINS] },
          description: "One domain. A link names two, the one that slipped first leading.",
        },
        text: {
          type: "string",
          description: "To the person, as 'you'. One or two plain sentences, under 320 characters.",
        },
        citedSessionIds: {
          type: "array",
          items: { type: "string" },
          description: "Ids of the sessions this rests on (2 or more; 3 for a shape).",
        },
        direction: {
          type: "string",
          enum: [...DIRECTIONS],
          description: "Only what the text claims about the domain NOW against its usual: lower or higher. An insight about the past (what helped, how it used to sound) is none.",
        },
      },
      required: ["kind", "domains", "text", "citedSessionIds", "direction"],
    },
  },
];

/** The insight tools' dispatch; null for any other name. */
export async function dispatchInsightTool(
  ctx: ActionCtx,
  emotionalProfileId: Id<"emotional_profiles">,
  name: string,
  input: Record<string, unknown>,
  runAt: number,
): Promise<string | null> {
  switch (name) {
    case "get_domain_steadiness":
      return JSON.stringify(
        await ctx.runQuery(internal.compounding.insightEvidence.domainSteadiness, {
          emotionalProfileId,
        }),
      );

    case "write_insight": {
      const draft = input as Partial<InsightDraft>;
      if (
        !INSIGHT_KINDS.includes(draft.kind as InsightKind) ||
        !Array.isArray(draft.domains) ||
        !draft.domains.every((d) => (DOMAINS as readonly string[]).includes(d)) ||
        typeof draft.text !== "string" ||
        !Array.isArray(draft.citedSessionIds) ||
        !DIRECTIONS.includes(draft.direction as InsightDraft["direction"])
      ) {
        return "Rejected, not saved: malformed input; follow the schema.";
      }
      return await ctx.runMutation(internal.compounding.insightStore.save, {
        emotionalProfileId,
        runAt,
        kind: draft.kind as InsightKind,
        domains: draft.domains,
        text: draft.text,
        citedSessionIds: draft.citedSessionIds.map(String),
        direction: draft.direction as InsightDraft["direction"],
      });
    }

    default:
      return null;
  }
}
