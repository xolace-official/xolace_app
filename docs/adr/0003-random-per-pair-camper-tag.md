# Random per-pair Camper tag instead of id-derived pseudonym

`pseudonym()` in `convex/xolacerChat.ts` names a seeker to their xolacer as
`Camper ${profileId.slice(-4)}`. Being a pure function of the seeker's own
`emotional_profiles` id, every xolacer who ever pairs with that seeker sees
the identical name — two xolacers comparing notes could infer they share a
seeker. We're replacing it with a random 4-char tag (`A-Z0-9`) generated once
and persisted on the `xolacer_conversations` row itself, rather than sliced
from the id. Because that table holds exactly one row per `(seeker, xolacer)`
pair for its entire lifetime (re-requests reopen the same row, never insert a
new one), a tag stored there is stable for that one relationship and nothing
wider — the same xolacer keeps seeing the same name for a returning seeker,
but a different xolacer pairing with that seeker gets a different name.

## Considered options

- **Slice a different substring of the id** (e.g. first 4 instead of last 4).
  Rejected — still a pure function of the seeker's id, so it reproduces the
  exact same cross-xolacer correlation, just with different digits.
- **Randomize per render / per query**, not persisted. Rejected — breaks the
  "same xolacer, same name, every time" requirement a busy xolacer's inbox
  depends on to tell concurrent seekers apart.

## Consequences

- Collision retry is scoped to one xolacer's own open pair rows only (a
  system-wide collision is a non-issue at ~1.7M combinations; a same-inbox
  collision would be a permanent, visible bug for that one xolacer).
- Existing rows predate this field and are never backfilled. A query cannot
  write, so they read a value derived from the pair row's own id
  (`legacyCamperTag`) — per-pair like a drawn tag, so it closes the same gap —
  and the first mutation to touch such a row persists that same value, so the
  name doesn't move a second time. Only a collision inside that one xolacer's
  inbox makes the heal draw a fresh tag instead.
- **Every pre-existing pair renames once, on deploy**, from a name off the
  seeker's id to one off the pair's. Accepted deliberately: the alternative is
  keeping the correlatable name on precisely the conversations that already
  exist, which is the gap this ADR is about. No in-app explanation ships with
  it — the feature is still behind `XOLACER_CHAT_ENABLED`, so the population
  that could notice is the pilot cohort at most.
- Stream's global per-profile `user.name` (upserted in
  `convex/integrations/stream.ts`) is never actually rendered — every surface
  already resolves the displayed name per-conversation client-side via
  `ConversationIdentityProvider`. It moves from the id-derived pseudonym to a
  generic `"Camper"` placeholder, so a future direct read of that field
  fails safe instead of leaking the correlatable id-derived value.
- A xolacer's own name toward a seeker (`xolacer.displayName`) is unaffected
  — see [Camper pseudonym](../../CONTEXT.md#camper-pseudonym-2026-08-19) in
  `CONTEXT.md`. That identity is meant to stay consistent across every seeker
  a xolacer helps; it was never in scope here.
