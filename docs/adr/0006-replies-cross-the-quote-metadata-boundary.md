# A reply to a thought crosses the quote path's metadata-only boundary

## Context

`convex/ai/quotesDistiller.ts` carries an explicit invariant on
`loadEmotionalContext`: **"NEVER accesses rawInput — only emotional
metadata."** Tomorrow's quote is built by one Haiku call from a rendered
semantic profile, the last two completed sessions' *classifications*
(emotion, intensity, thematic tags, recency), preferred themes, and the
recent-quote avoid-list. No user sentence has ever reached that prompt.

The redesigned Today's Thought screen adds a reply box — "What does this
bring for you?" — and answers it with "Tomorrow's thought will listen to
what you just said." Honouring that promise means the reply reaches the
quote generator, and a reply is a user sentence.

The Cognition Layer Constitution bars a model call to re-derive what the
Understanding already knows. A reply is genuinely new signal, so a call
*could* be argued for — but the signal is text, and text needs no
derivation. The question was never whether to distill the reply. It was
whether raw text may enter this particular prompt at all.

## Decision

**It may, bounded and guarded.**

`loadRecentReplies` reads the 3 most recent replies within 7 days, each
truncated to ~280 characters, newest first, each labelled with its recency
the way `emotionalSummary` labels sessions. They enter `buildQuotePrompt`
as their own block, stated to be the person's own words with the newest as
the live signal.

Two guards ship with it, neither optional:

- The prompt's NEVER block gains *never quote, paraphrase, or reference a
  reply's specifics — take its register, not its content*, the same
  seed-don't-borrow instruction it already gives for source aphorisms.
- `validateQuote` gains a **verbatim-overlap check**: a quote sharing a
  distinctive 4-word run with any reply in context is rejected, and the
  existing retry-once loop handles it.

`3` and `7 days` are tunable constants. The query is identical at `1`.

## Considered options

- **Distill the reply into a themes line first** (a model call), keeping
  the prompt metadata-only. Rejected: Constitution-barred without an
  argument, and it discards precisely the thing that made the reply worth
  reading — the person's own register and vocabulary.
- **Route the reply through episodic memory** so the existing cognition
  layer picks it up. Rejected *for this purpose*: `quotesDistiller` never
  queries RAG, so this reaches tomorrow's quote only by also adding a
  vector search to the quote path. It remains the right idea for the
  mirror and for semantic-profile consolidation, tracked separately.
- **Verbatim with no new guard.** Rejected: see Consequences.

## Consequences

- The metadata-only comment on `loadEmotionalContext` is no longer true of
  the quote path as a whole and must be rewritten, not left standing.
- **The generated quote is publicly shareable** — the system prompt already
  says so. Without the overlap check, a name or detail in a reply can reach
  a shared card. This is why the check is load-bearing rather than polish.
- Verbatim user words in context are the single most reliable way to
  produce "You're beginning to see that it's exhaustion" — the mirroring
  failure the prompt's NEVER list was written against. The instruction
  alone was judged insufficient; the mechanical check is the backstop.
- The boundary is now a bounded aperture rather than a wall. A future
  feature will not find "we never do this" as the answer, only "we do it
  here, this narrowly, for these reasons." That is the reversibility cost
  being accepted.
- A reply still cannot *cause* a quote to exist. The generation gate is
  unchanged: no recent session, no quote.
