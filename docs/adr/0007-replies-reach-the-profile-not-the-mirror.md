# A reply enters episodic memory for the semantic profile, but never for the mirror

## Context

[ADR 0006](./0006-replies-cross-the-quote-metadata-boundary.md) routed a
reply into tomorrow's quote by direct read, and deliberately left open
whether the reply should *also* enter the user's personal RAG namespace.

Two consumers already read that namespace: the mirror pipeline
(`ai/process.ts` → `ai/helpers/episodicSearch.ts`) and the semantic-profile
agent's `search_episodic_memory` tool (`ai/reflectionAgent/tools.ts`). A
single `rag.add` with `namespace = emotionalProfileId` would reach both with
no code on either consumer's side — which is what made the question worth
asking, and also what made "both" the default outcome unless something
stopped it.

The screen's compose footer — "Whatever you write helps Xolace understand
you a little deeper" — is the copy this decision underwrites.

## Decision

**The reply is embedded, and the mirror is filtered out of seeing it.**

The entry is added with `status: "reply"` (`status` is already a declared
filter name in `convex/rag.ts`, inert in the personal namespace, and every
existing entry already carries `EPISODIC_STATUS`, so no backfill is
needed). `searchEpisodicMemory` gains `status = EPISODIC_STATUS` as a query
filter and therefore never retrieves a reply. The profile agent's search
stays unfiltered and does.

- **Key**: `reply:<quoteId>` — prefixed, not a bare id. An edit re-`add`s
  under the same key (idempotent replace); a reply cleared to empty purges
  by key.
- **Composite**: a one-line provenance label (`reply to a daily thought`
  plus the date) followed by the reply text. The quote text is *not*
  included.
- **Gates**: a moderation-flagged reply is not embedded (parity with its
  exclusion from the quote prompt); `personalMemoryEnabled === false` means
  not embedded at all; free and premium users are treated identically.
- **Weight**: a new `REPLY_IMPORTANCE = 0.7` in `episodicImportance.ts` —
  seeded, never earned, never adjusted.
- **Deletion**: `purgeReplyEntries` is called from the quote-deleting loops
  in `jobs/dataWipe.ts` and `jobs/accountDeletion.ts`, and the
  `sessionCascade.test.ts` guard is widened to assert every episodic key
  class has a purge call-site.

## Considered options

- **Neither consumer** — leave the reply quote-prompt-only. Rejected: the
  profile is the one consumer where a reply is unambiguously the right
  input (recurring themes, the person's own words), and 0006's argument for
  refusing reach was about the *mirror*, not the profile.
- **Both consumers** — one `rag.add`, no filter. Rejected: 0006 judged
  "your next reflection will listen" a bigger claim than the screen makes,
  and nothing here overturns it. It would also drag the mirror's register
  and verbatim guards into scope.
- **Leave the weight at `DEFAULT_IMPORTANCE`.** Rejected: `DEFAULT_IMPORTANCE`
  *is* `MAX_IMPORTANCE`, so a reply would sit permanently at the ceiling,
  outranking every session memory that was ever decayed.
- **Embed the quote text as context.** Rejected: the quote is
  model-authored, and on a short reply it would dominate the embedding —
  the entry would match on the quote's themes rather than the user's words,
  inverting the purpose of the namespace.

## Consequences

- **The `status` filter on `searchEpisodicMemory` is load-bearing and looks
  like a no-op.** To a reader who does not know a reply class exists, it
  filters on the only value present and is an obvious cleanup. Deleting it
  silently ships the rejected "both consumers" option. This ADR is that
  filter's reason to exist.
- **A second episodic key class now exists.** Before this, "episodic key"
  and "sessionId" were the same thing, and `applyMemoryFeedback` casts
  `key as Id<"sessions">` on that basis. The filter is what keeps that cast
  safe; the `reply:` prefix is what makes a future violation wrong on
  inspection rather than at runtime.
- **Wipe parity was not free.** Episodic purge previously ran only through
  `purgeSessions`, while both `dataWipe` and `accountDeletion` delete
  `daily_quotes` rows and touch no vector — so without the new purge, a
  reply's embedding would outlive the account that wrote it.
- **The reach is lagged, and deliberately so.** Consolidation is triggered
  only by session completion, so a reply is seen the next time the user
  finishes a reflection. A reply cannot cause consolidation, just as it
  cannot cause a quote to exist.
- **A memory-off user's reply still reaches tomorrow's quote** (0006 is
  unchanged) but never their profile. The two paths now diverge on that
  preference.
- **"This stays yours" understates.** The reply never leaves the user's
  namespace, but it is no longer inert, and the compose fallback copy must
  say so.
