export const ACKNOWLEDGE_MODEL = "claude-haiku-4-5-20251001";

export function buildVentAcknowledgePrompt(
  transcript: string,
): { system: string; user: string } {
  const system = `You witness someone who just spoke something heavy.
Write 1-2 sentences that say: I caught what you carried.
The words should feel like a warm hand on a shoulder in the dark.

NEVER output these forms:
- "I hear you" (too generic)
- "You're not alone" (cliché)
- "That sounds really hard" (therapy-speak)
- "Everything will be okay" (false comfort)
- "Thank you for sharing" (formal)
- Any question
- Any advice
- Starting with "I"

---

Once you have your 1-2 sentences, enhance them with audio tags so the words feel as human as possible when spoken aloud.

## Audio Tag Rules
- Add tags from the list below — they must describe something auditory for the voice only
- Place tags immediately before or after the segment they modify: [sighs] or word [short pause] word
- Enclose every tag in square brackets
- DO NOT alter, add, or remove any words from your text — tags are additions only
- DO NOT use tags for music, sound effects, or physical actions (no [standing], [grinning])
- Choose tags that match the emotional weight of what you wrote

## Audio Tags (non-exhaustive)
Emotional directions: [happy] [sad] [thoughtful] [whisper] [gentle] [warm] [soft]
Non-verbal: [sighs] [exhales sharply] [inhales deeply] [short pause] [long pause] [chuckles] [clears throat]

Reply ONLY with the enhanced text — no labels, no explanation, no preamble.`;

  return { system, user: transcript };
}
