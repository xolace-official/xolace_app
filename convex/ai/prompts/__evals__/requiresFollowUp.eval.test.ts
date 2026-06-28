/**
 * Live-Haiku eval for the classifier's `requiresFollowUp` flag.
 *
 * Run: `bun test convex/ai/prompts/__evals__/requiresFollowUp.eval.ts`
 * Requires ANTHROPIC_API_KEY (bun auto-loads .env.local). Skips cleanly when
 * the key is absent so CI without secrets stays green.
 *
 * This is a calibration eval, not a unit test — it calls the real model. A
 * couple of borderline misses are acceptable signal, not a hard failure; the
 * suite asserts overall accuracy >= 0.8 across the labeled set plus exact
 * correctness on the unambiguous anchors.
 */
import { describe, expect, it } from "bun:test";
import { getAnthropicClient, parseClassificationResponse, CLASSIFIER_MODEL } from "../../providers/anthropic";
import { buildClassifierPrompt } from "../classifier";

type Case = {
  input: string;
  entryType?: string;
  expected: boolean;
  anchor?: boolean; // unambiguous — must be exactly right
  note: string;
};

const CASES: Case[] = [
  // --- true: unresolved, high-stakes ---
  { input: "My dad died three months ago and I still can't open his last text to me. It just sits there.", expected: true, anchor: true, note: "grief, past-focused, unresolved" },
  { input: "I keep replaying how I let everyone down at work. I'm such a fraud and everyone can see it.", expected: true, anchor: true, note: "shame, high intensity" },
  { input: "She left and didn't even say why. I don't understand what I did wrong.", expected: true, note: "relational rupture, no resolution" },
  { input: "I don't know who I am anymore. Nothing I do feels like mine.", expected: true, note: "identity, present despair" },
  { input: "everything is heavy and i can't put it down no matter what i try", expected: true, note: "stuck, no release" },
  { input: "I miss my mom so much it physically hurts and it's been years.", expected: true, note: "grief, enduring" },
  { input: "I feel like I'm failing as a parent and my kids deserve better than me.", expected: true, note: "shame/self-worth" },
  { input: "We had a huge fight and he said things he can't take back. I don't know if we recover from this.", expected: true, note: "rupture, unresolved" },

  // --- false: discharged / low stakes / future-anxiety / positive ---
  { input: "Honestly just needed to vent about my commute. Feeling better already, thanks.", expected: false, anchor: true, note: "vent complete" },
  { input: "A bit annoyed my coffee order was wrong this morning, no big deal.", expected: false, anchor: true, note: "low intensity" },
  { input: "I'm nervous about my presentation tomorrow but I think I'm prepared.", expected: false, note: "future-focused anxiety, grounded" },
  { input: "Feeling really grateful today, the weather is nice and I slept well.", expected: false, anchor: true, note: "positive check-in" },
  { input: "Work is busy and a little stressful but nothing I can't handle.", expected: false, note: "general stress" },
  { input: "Kind of tired, kind of meh. Just checking in.", expected: false, note: "low intensity, hedged" },
  { input: "Excited about the trip next week! So much to plan.", expected: false, note: "positive, future" },
  { input: "I was frustrated earlier but I talked it through with a friend and we're good now.", expected: false, note: "resolved" },
];

const hasKey = !!process.env.ANTHROPIC_API_KEY;

async function classify(c: Case): Promise<boolean> {
  const prompt = buildClassifierPrompt(c.input, "(no prior pattern context)", false, c.entryType ?? "open_prompt");
  const anthropic = getAnthropicClient();
  const res = await anthropic.messages.create({
    model: CLASSIFIER_MODEL,
    max_tokens: 400,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });
  const raw = res.content.find((b) => b.type === "text");
  const parsed = parseClassificationResponse(raw && raw.type === "text" ? raw.text : "{}");
  return parsed.requiresFollowUp;
}

describe("classifier requiresFollowUp eval (live Haiku)", () => {
  let correct = 0;

  for (const c of CASES) {
    it(`${c.expected ? "TRUE " : "FALSE"} — ${c.note}`, async () => {
      // Skip cleanly without a key so CI without secrets stays green.
      if (!hasKey) return;
      const got = await classify(c);
      if (got === c.expected) correct++;
      // Anchors must be exactly right; non-anchors feed the aggregate.
      if (c.anchor) {
        expect(got).toBe(c.expected);
      }
    });
  }

  it("aggregate accuracy across the labeled set is >= 0.8", () => {
    if (!hasKey) return;
    expect(correct / CASES.length).toBeGreaterThanOrEqual(0.8);
  });
});
