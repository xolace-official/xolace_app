import { buildClassifierPrompt } from "../../../convex/ai/prompts/classifier";
import { getAnthropicClient, parseClassificationResponse, CLASSIFIER_MODEL } from "../../../convex/ai/providers/anthropic";
import { PAIRS } from "./pairs";

const REPS = 3;
// Variant B: strip both length cues, state length-neutrality outright.
const fixB = (s: string) => s
  .replace(", very short punchy input (the most intense feelings sometimes produce the fewest words)", "")
  .replace(', observational tone ("I noticed I feel..."), long reflective writing,', ', observational tone ("I noticed I feel..."),')
  .replace("- Short input does not mean low intensity. \"I'm done\" at 2am can be more intense than three paragraphs of reflective writing.",
    "- Length is not a signal in either direction. Judge the weight of what is described, not how many words describe it. \"I'm done\" and three paragraphs about the same loss carry the same intensity.");

const client = getAnthropicClient();
async function score(text: string, variant: "A" | "B") {
  const p = buildClassifierPrompt(text, "(no prior pattern context)", false, "open_prompt");
  const system = variant === "B" ? fixB(p.system) : p.system;
  if (variant === "B" && system === p.system) throw new Error("fix did not apply");
  const res = await client.messages.create({ model: CLASSIFIER_MODEL, max_tokens: 500, system, messages: [{ role: "user", content: p.user }] });
  const t = res.content.find((b) => b.type === "text");
  return parseClassificationResponse(t && t.type === "text" ? t.text : "{}").intensity;
}
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const rows: any[] = [];
await Promise.all(PAIRS.flatMap((p) => (["A", "B"] as const).map(async (v) => {
  const s = await Promise.all(Array.from({ length: REPS }, () => score(p.short, v)));
  const l = await Promise.all(Array.from({ length: REPS }, () => score(p.long, v)));
  rows.push({ id: p.id, v, weight: p.weight, short: s, long: l, delta: +(mean(l) - mean(s)).toFixed(2), shortErr: +(mean(s) - p.weight).toFixed(2), longErr: +(mean(l) - p.weight).toFixed(2) });
})));
rows.sort((a, b) => a.id.localeCompare(b.id) || a.v.localeCompare(b.v));
for (const r of rows) console.log(JSON.stringify(r));
for (const v of ["A", "B"]) {
  const rs = rows.filter((r) => r.v === v);
  const mae = (k: string) => mean(rs.map((r) => Math.abs(r[k]))).toFixed(2);
  console.log(`variant ${v}: mean(long-short)=${mean(rs.map((r) => r.delta)).toFixed(2)}  heavy(w>=7) delta=${mean(rs.filter((r) => r.weight >= 7).map((r) => r.delta)).toFixed(2)}  MAE short=${mae("shortErr")} long=${mae("longErr")}`);
}
