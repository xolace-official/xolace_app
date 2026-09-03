# Xolacer rating is decoupled from conversation lifecycle

## Context

The only rate entry point lived in `ThreadStatusBar`, which renders only when
a conversation is **not `open`**. The single seeker-reachable path out of
`open` is the 14-day quiet sweep (`RESTING_AFTER_MS`), so in practice a seeker
could not rate a xolacer for roughly two weeks — and the entry point, a small
underlined link, was being missed even then. `canRate` never actually required
`resting`; placement did.

## Decision

Rating eligibility is `role === "user"` + not blocked + `messageCount >= 15`,
evaluated on **any** conversation status including `open`. `hasRealExchange`
(at least one message after accept) remains the floor beneath the count.

A new server-side `messageCount` on `xolacer_conversations` is the enforced
count, incremented in the Stream `message.new` webhook handler
(`notifyNewMessage`) before its `status !== "open"` early-return. It exists
because message content lives in Stream and the server predicate had nothing
to count. Existing rows start at 0; no backfill.

The primary entry point moves to a prominent card on the xolacer profile
screen, shown once the bar is met and collapsing to a quiet "change your
rating" line after the first rating. A secondary entry stays in the thread
overflow menu; the post-quiet `RatePrompt` is unchanged.

`15` is provisional, to be retuned once rating analytics exist.

## Considered options

- **Keep the wind-down gate; add a seeker-side manual "wrap up."** Rejected:
  forces a seeker who wants to rate to first end a conversation they may want
  to keep, and archive already covers "off my list."
- **Client-side count gate (trust Stream's message count from the client).**
  Rejected: leaves the eligibility number unenforced, against the codebase's
  existing treatment of `hasRealExchange` as an abuse guard.

## Consequences

- `getConversation.canRate` can now be `true` on an `open` conversation; every
  consumer must tolerate that.
- The "ignoring the rating prompt is the default" posture is reversed for the
  profile surface (prominent until first rating), unchanged everywhere else.
- The 14d -> 7d resting-window change is now independent of rating and tracked
  as a separate follow-up.
- Optional written reviews (7 Cups-style moderation + staged visibility) are
  deferred, not rejected; migration is a safe additive change.
