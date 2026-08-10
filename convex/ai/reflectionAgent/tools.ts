import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { rag } from "../../rag";
import { REFLECTION_CONSOLIDATION_VERSION } from "../providers/anthropic";

// =============================================================
// Reflection Agent — TOOL SET (Cognition Layer Phase 3).
//
// Read tools resolve to bounded internalQueries (toolQueries.ts).
// search_episodic_memory queries RAG inline in the user's personal namespace.
// The single write tool, update_profile_section, is restricted to the four
// narrative sections and always goes through the sanctioned createVersion
// path (which is itself wipe-guarded and versioned).
//
// The strangler write-tools (queue_follow_up / propose_notification /
// write_insight) are deliberately NOT here yet — doc §3 mandates absorbing
// them one at a time behind a comparison period.
// =============================================================

export const REFLECTION_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_emotion_timeline",
    description:
      "The person's recent emotions over time (primary + granular emotion, intensity, themes, their own words, temporal focus, timestamp), newest first. Use to spot recurring feelings and how intensity moves.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "search_episodic_memory",
    description:
      "Semantically search this person's own past reflections for moments similar to a query (e.g. a theme or their own phrase). Returns matching composite memories. Use to test whether a pattern actually recurs.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to look for — a theme, feeling, or the person's phrase.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_recent_sessions",
    description:
      "Recent sessions with their shape: how the mirror landed (confirmed / refined / gave up), the path chosen, the mirror text, and post-session mood. Newest first.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_mood_deltas",
    description:
      "Post-session mood signals over recent sessions (lighter / same / heavier / unsure) with timestamps. Use to see whether sessions tend to help.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_confirmation_stats",
    description:
      "Aggregate of how mirrors have landed (confirmation-state tallies) and which tones were used, across a recent window. Use to gauge what tends to resonate.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "read_semantic_profile",
    description:
      "The current narrative profile you are refining, rendered whole, with its version number. Read this before writing so you build on it rather than discard it.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "update_profile_section",
    description:
      "Write the new profile version. Call this exactly ONCE, at the end, after gathering evidence. Provide recurringThemes, emotionalSignatures, and trajectory (leave calibration alone). User-safe, non-clinical language.",
    input_schema: {
      type: "object",
      properties: {
        recurringThemes: {
          type: "string",
          description: "What this person keeps carrying.",
        },
        emotionalSignatures: {
          type: "string",
          description:
            "How their emotions tend to behave, e.g. 'anger usually masks fear; goes quiet rather than escalating'.",
        },
        trajectory: {
          type: "string",
          description: "Where things have been heading recently.",
        },
      },
    },
  },
];

/** Names the loop treats as the terminal write step. */
export const WRITE_TOOL = "update_profile_section";

/**
 * Execute one tool call and return the string that becomes the tool_result.
 * Read tools JSON-stringify their query output; the write tool commits a new
 * profile version through createVersion and returns a short confirmation.
 */
export async function dispatchTool(
  ctx: ActionCtx,
  emotionalProfileId: Id<"emotional_profiles">,
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "get_emotion_timeline":
      return JSON.stringify(
        await ctx.runQuery(
          internal.ai.reflectionAgent.toolQueries.getEmotionTimeline,
          { emotionalProfileId },
        ),
      );

    case "get_recent_sessions":
      return JSON.stringify(
        await ctx.runQuery(
          internal.ai.reflectionAgent.toolQueries.getRecentSessions,
          { emotionalProfileId },
        ),
      );

    case "get_mood_deltas":
      return JSON.stringify(
        await ctx.runQuery(
          internal.ai.reflectionAgent.toolQueries.getMoodDeltas,
          { emotionalProfileId },
        ),
      );

    case "get_confirmation_stats":
      return JSON.stringify(
        await ctx.runQuery(
          internal.ai.reflectionAgent.toolQueries.getConfirmationStats,
          { emotionalProfileId },
        ),
      );

    case "read_semantic_profile":
      return JSON.stringify(
        await ctx.runQuery(
          internal.ai.reflectionAgent.toolQueries.readSemanticProfile,
          { emotionalProfileId },
        ),
      );

    case "search_episodic_memory": {
      const query = typeof input.query === "string" ? input.query : "";
      if (!query.trim()) return JSON.stringify({ matches: [] });
      try {
        const { entries } = await rag.search(ctx, {
          namespace: emotionalProfileId,
          query,
          limit: 5,
        });
        return JSON.stringify({ matches: entries.map((e) => e.text) });
      } catch {
        // No namespace yet or embedding outage — memory can never block.
        return JSON.stringify({ matches: [] });
      }
    }

    case WRITE_TOOL: {
      const sections: {
        recurringThemes?: string;
        emotionalSignatures?: string;
        trajectory?: string;
      } = {};
      if (typeof input.recurringThemes === "string" && input.recurringThemes.trim()) {
        sections.recurringThemes = input.recurringThemes.trim();
      }
      if (
        typeof input.emotionalSignatures === "string" &&
        input.emotionalSignatures.trim()
      ) {
        sections.emotionalSignatures = input.emotionalSignatures.trim();
      }
      if (typeof input.trajectory === "string" && input.trajectory.trim()) {
        sections.trajectory = input.trajectory.trim();
      }
      if (Object.keys(sections).length === 0) {
        return "No sections provided — nothing written. Provide at least one section.";
      }
      const newId = await ctx.runMutation(
        internal.semanticProfiles.createVersion,
        {
          emotionalProfileId,
          ...sections,
          writerVersion: REFLECTION_CONSOLIDATION_VERSION,
        },
      );
      return newId
        ? "New profile version written."
        : "Write skipped (a data wipe is in progress).";
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
