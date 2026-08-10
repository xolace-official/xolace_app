// Model call + retry loop for session-derived quotes.
// V8 runtime — Anthropic SDK uses fetch, no Node built-ins needed.

import { getAnthropicClient } from "./providers/anthropic";
import { parseQuoteResponse } from "./quotesPrompt";
import { validateQuote } from "./quotesQuality";

const DISTILLER_MODEL = "claude-haiku-4-5-20251001";

const RETRY_NUDGE =
  "That attempt did not land — it ran long, drifted into explaining the reader, or was not valid JSON. Write it again: one breath, around 20 words, no interpretation, JSON only.";

/**
 * Ask the model for a quote, validate it, and retry once with a nudge back
 * toward aphorism shape rather than dropping the user's quote for the day.
 * Returns null when both attempts fail.
 *
 * `label` only appears in logs (the emotional profile id at the call site).
 */
export async function requestQuoteText(args: {
  systemPrompt: string;
  userPrompt: string;
  label: string;
}): Promise<string | null> {
  const client = getAnthropicClient();
  const prompts = [args.userPrompt, `${args.userPrompt}\n\n${RETRY_NUDGE}`];

  for (const prompt of prompts) {
    let response;
    try {
      response = await client.messages.create({
        model: DISTILLER_MODEL,
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
        system: args.systemPrompt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[quotesDistiller] API call failed for ${args.label}: ${message}`);
      continue;
    }

    const rawText: string | null =
      response.content[0].type === "text" ? response.content[0].text.trim() : null;

    if (!rawText) {
      console.error(`[quotesDistiller] Empty response for ${args.label}`);
      continue;
    }

    const parsed = parseQuoteResponse(rawText);
    if (!parsed) {
      console.error(
        `[quotesDistiller] Unparseable response for ${args.label}: ${rawText.slice(0, 160)}`
      );
      continue;
    }

    console.log(
      `[quotesDistiller] Seeds for ${args.label}: ${parsed.seeds.join(" | ") || "(none)"}`
    );

    const validation = validateQuote(parsed.quote);
    if (!validation.ok) {
      console.error(
        `[quotesDistiller] Quote failed validation for ${args.label}: ${validation.reason}`
      );
      continue;
    }

    return parsed.quote;
  }

  return null;
}
