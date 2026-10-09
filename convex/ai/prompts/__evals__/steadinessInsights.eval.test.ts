/**
 * Steadiness insights, live (#525). Runs the real consolidation prompt and
 * tool set over a fixture person, with every write_insight going through the
 * real quality gate, and prints what passed and what was turned away.
 *
 * Run: `bun run test:evals convex/ai/prompts/__evals__/steadinessInsights`
 * (needs ANTHROPIC_API_KEY; skips cleanly without).
 *
 * Bar: a person with real patterns (sleep slipping days before work, a walk
 * that helped twice, "drowning" → "stretched", money on Sunday evenings) gets
 * at least two insights, all through the gate; a person with thin evidence
 * gets none. Filler is the failure, not silence.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { gateInsight, type CitableSession, type InsightDraft } from "../../../compounding/insightGate";
import { when } from "../../../compounding/insightEvidence";
import type { Domain } from "../../../lib/understandingVocab";
import { DOMAIN_LABELS } from "../../../lib/understandingVocab";
import { getAnthropicClient, REFLECTION_CONSOLIDATION_MODEL } from "../../providers/anthropic";
import { INSIGHT_TOOLS } from "../../reflectionAgent/insightTools";
import { REFLECTION_TOOLS, WRITE_TOOL } from "../../reflectionAgent/tools";
import { buildConsolidationSystemPrompt } from "../reflectionConsolidation";
import { hasApiKey } from "./harness.eval";

const TZ = "UTC";
const NOW = Date.UTC(2026, 9, 9, 12);
const DAY = 86_400_000;
const at = (daysAgo: number, hour: number) => {
  const d = new Date(NOW - daysAgo * DAY);
  return d.setUTCHours(hour, 0, 0, 0);
};
/** The nth Sunday before NOW, at `hour`. */
const sunday = (n: number, hour: number) => {
  const d = new Date(NOW);
  const back = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  return at(back + (n - 1) * 7, hour);
};

type FixtureSession = {
  id: string;
  at: number;
  domains: Domain[];
  emotion: string;
  intensity: number;
  theirWords: string[];
  chose?: string;
  moodAfter?: "lighter" | "same" | "heavier";
  checkIn?: { answer: string; whatHelped: string | null };
};
type Fixture = { sessions: FixtureSession[]; domains: Record<string, { steadiness: number; usual: number; compounding?: object }> };

const SOLO = "stayed with it a while (Sit with this)";
const RICH: Fixture = {
  sessions: [
    { id: "s01", at: at(78, 1), domains: ["health"], emotion: "exhaustion", intensity: 7, theirWords: ["couldn't sleep again", "3am ceiling"] },
    { id: "s02", at: at(76, 2), domains: ["health"], emotion: "restlessness", intensity: 7, theirWords: ["awake till 4"] },
    { id: "s03", at: at(73, 9), domains: ["work"], emotion: "overwhelm", intensity: 8, theirWords: ["drowning", "can't breathe at my desk"], chose: SOLO, moodAfter: "heavier" },
    { id: "s04", at: at(71, 15), domains: ["work", "health"], emotion: "dread", intensity: 8, theirWords: ["drowning in tickets", "tired all the time"] },
    { id: "s05", at: at(69, 19), domains: ["work"], emotion: "overwhelm", intensity: 7, theirWords: ["drowning"], chose: SOLO, moodAfter: "lighter", checkIn: { answer: "lighter", whatHelped: "walked to the lagoon before opening my laptop" } },
    { id: "s06", at: at(40, 18), domains: ["family"], emotion: "joy", intensity: 3, theirWords: ["sister's wedding"], moodAfter: "lighter" },
    { id: "s07", at: at(30, 1), domains: ["health"], emotion: "exhaustion", intensity: 7, theirWords: ["can't switch off at night"] },
    { id: "s08", at: at(28, 2), domains: ["health", "work"], emotion: "restlessness", intensity: 6, theirWords: ["lying awake replaying standup"] },
    { id: "s09", at: at(25, 9), domains: ["work"], emotion: "anxiety", intensity: 7, theirWords: ["behind again"] },
    { id: "s10", at: at(23, 19), domains: ["work"], emotion: "overwhelm", intensity: 6, theirWords: ["stretched"], chose: SOLO, moodAfter: "lighter", checkIn: { answer: "lighter", whatHelped: "the morning walk again, and writing the list on paper" } },
    { id: "s11", at: at(5, 15), domains: ["work"], emotion: "frustration", intensity: 5, theirWords: ["stretched", "behind but managing"] },
    { id: "s12", at: at(2, 9), domains: ["work"], emotion: "anxiety", intensity: 5, theirWords: ["stretched thin but okay"] },
    { id: "s13", at: sunday(1, 20), domains: ["money"], emotion: "dread", intensity: 6, theirWords: ["rent", "sunday scaries"] },
    { id: "s14", at: sunday(3, 21), domains: ["money"], emotion: "anxiety", intensity: 6, theirWords: ["rent again", "counting what's left"] },
    { id: "s15", at: sunday(6, 20), domains: ["money"], emotion: "dread", intensity: 7, theirWords: ["sunday scaries", "bank app"] },
    { id: "s16", at: sunday(9, 19), domains: ["money"], emotion: "worry", intensity: 5, theirWords: ["landlord text"] },
  ],
  domains: {
    work: { steadiness: 52, usual: 64, compounding: { state: "easing", since: when(at(25, 9), TZ), linkedOnsetOrder: [`health (${when(at(30, 1), TZ)})`, `work (${when(at(25, 9), TZ)})`] } },
    health: { steadiness: 55, usual: 62, compounding: { state: "compounding", since: when(at(30, 1), TZ), linkedOnsetOrder: [`health (${when(at(30, 1), TZ)})`, `work (${when(at(25, 9), TZ)})`] } },
    money: { steadiness: 58, usual: 65 },
    family: { steadiness: 80, usual: 78 },
  },
};

const THIN: Fixture = {
  sessions: [
    { id: "t1", at: at(9, 18), domains: ["work"], emotion: "tiredness", intensity: 4, theirWords: ["long week"] },
    { id: "t2", at: at(5, 18), domains: ["work"], emotion: "frustration", intensity: 5, theirWords: ["busy"] },
    { id: "t3", at: at(2, 18), domains: ["work"], emotion: "tiredness", intensity: 4, theirWords: ["tired"] },
  ],
  domains: { work: { steadiness: 60, usual: 62 } },
};

const view = (f: Fixture) => ({
  today: when(NOW, TZ),
  domains: Object.entries(f.domains).map(([domain, d]) => ({
    domain, label: DOMAIN_LABELS[domain as Domain], steadiness: d.steadiness, usual: d.usual, weekTrend: null, quietSince: null, compounding: d.compounding ?? null,
  })),
  sessions: [...f.sessions].sort((a, b) => b.at - a.at).map((s) => ({
    id: s.id, when: when(s.at, TZ), domains: s.domains, alsoAbout: [], emotion: s.emotion, intensity: s.intensity,
    theirWords: s.theirWords, chose: s.chose ?? null, moodAfter: s.moodAfter ?? null, checkIn: s.checkIn ?? null,
  })),
});

type Outcome = { saved: InsightDraft[]; rejected: { draft: InsightDraft; reason: string }[] };

async function runPass(f: Fixture): Promise<Outcome> {
  const evidence = {
    sessions: new Map<string, CitableSession>(f.sessions.map((s) => [s.id, {
      id: s.id, at: s.at, domains: s.domains,
      lighter: s.moodAfter === "lighter" || s.checkIn?.answer === "lighter" || s.checkIn?.answer === "processed",
    }])),
    domains: new Map(Object.entries(f.domains).map(([d, n]) => [d as Domain, { steadiness: n.steadiness, baseline: n.usual }])),
  };
  const out: Outcome = { saved: [], rejected: [] };
  const search = (q: string) => {
    const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    return f.sessions
      .filter((s) => words.some((w) => [...s.theirWords, s.emotion, ...s.domains].join(" ").toLowerCase().includes(w)))
      .slice(0, 5)
      .map((s) => ({ sessionId: s.id, text: `${when(s.at, TZ)} | emotion: ${s.emotion} | their words: ${s.theirWords.join(", ")}` }));
  };
  const tool = (name: string, input: Record<string, unknown>): string => {
    switch (name) {
      case "read_semantic_profile": return JSON.stringify({ version: null, rendered: null });
      case "get_domain_steadiness": return JSON.stringify(view(f));
      case "search_episodic_memory": return JSON.stringify({ matches: search(String(input.query ?? "")) });
      case "write_insight": {
        const draft = input as InsightDraft;
        const r = gateInsight(draft, evidence);
        if (r.ok) out.saved.push(draft);
        else out.rejected.push({ draft, reason: r.reason });
        return r.ok ? "Saved." : `Rejected, not saved: ${r.reason}`;
      }
      case WRITE_TOOL: return "New profile version written.";
      default: return JSON.stringify([]);
    }
  };

  const messages: Anthropic.MessageParam[] = [{
    role: "user",
    content: "Consolidate this person's emotional profile. Read the current profile first, gather evidence with the read tools, write any steadiness insights that pass the bar, then write the new version once.",
  }];
  for (let i = 0; i < 12; i++) {
    const res = await getAnthropicClient().messages.create(
      { model: REFLECTION_CONSOLIDATION_MODEL, max_tokens: 3072, system: buildConsolidationSystemPrompt({ insights: true }), tools: [...REFLECTION_TOOLS, ...INSIGHT_TOOLS], messages },
      { timeout: 120_000 },
    );
    messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason !== "tool_use") break;
    const calls = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    messages.push({ role: "user", content: calls.map((b) => ({ type: "tool_result" as const, tool_use_id: b.id, content: tool(b.name, b.input as Record<string, unknown>) })) });
    if (calls.some((b) => b.name === WRITE_TOOL)) break;
  }
  return out;
}

const report = (label: string, o: Outcome) =>
  console.log(
    `\n── ${label} ──\n` +
      o.saved.map((d) => `SAVED  [${d.kind} ${d.domains.join("→")}] ${d.text}  (cites ${d.citedSessionIds.join(", ")})`).join("\n") +
      (o.rejected.length ? "\n" : "") +
      o.rejected.map((r) => `REJECT [${r.draft.kind} ${r.draft.domains?.join("→")}] ${r.draft.text}\n       ↳ ${r.reason}`).join("\n"),
  );

describe("steadiness insights (live)", () => {
  it.skipIf(!hasApiKey())("finds real patterns for a person who has them", async () => {
    const o = await runPass(RICH);
    report("rich", o);
    expect(o.saved.length).toBeGreaterThanOrEqual(2);
  }, 300_000);

  it.skipIf(!hasApiKey())("writes nothing for thin evidence", async () => {
    const o = await runPass(THIN);
    report("thin", o);
    expect(o.saved).toEqual([]);
  }, 300_000);
});
