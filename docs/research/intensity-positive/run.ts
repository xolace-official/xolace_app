// Scores positive probes on the live classifier (prompt A, unchanged) and shows the steadiness reading each would produce.
// Run from the repo root: `bun docs/research/intensity-positive/run.ts`
import { buildClassifierPrompt } from "../../../convex/ai/prompts/classifier";
import { getAnthropicClient, parseClassificationResponse, CLASSIFIER_MODEL } from "../../../convex/ai/providers/anthropic";
import { PROBES } from "./probes";

const REPS = 3;
const client = getAnthropicClient();
const reading = (i: number) => Math.round(100 - ((i - 1) * 100) / 9);
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

async function classify(text: string) {
  const p = buildClassifierPrompt(text, "(no prior pattern context)", false, "open_prompt");
  const res = await client.messages.create({ model: CLASSIFIER_MODEL, max_tokens: 500, system: p.system, messages: [{ role: "user", content: p.user }] });
  const t = res.content.find((b) => b.type === "text");
  const c = parseClassificationResponse(t && t.type === "text" ? t.text : "{}");
  return { emotion: c.primaryEmotion, intensity: c.intensity, supportNeed: c.supportNeed };
}

const rows = await Promise.all(PROBES.map(async (p) => {
  const runs = await Promise.all(Array.from({ length: REPS }, () => classify(p.text)));
  const m = mean(runs.map((r) => r.intensity));
  return { id: p.id, register: p.register, emotions: runs.map((r) => r.emotion), intensity: runs.map((r) => r.intensity), mean: +m.toFixed(2), reading: reading(m) };
}));
for (const r of rows) console.log(JSON.stringify(r));
for (const reg of ["excited", "warm", "calm", "mixed"]) {
  const rs = rows.filter((r) => r.register === reg);
  const m = mean(rs.map((r) => r.mean));
  console.log(`${reg}: mean intensity ${m.toFixed(2)} -> reading ${reading(m)}`);
}
