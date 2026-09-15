# Trusted Bridge becomes a kindling twig — gated, not open

Trusted Bridge shipped (1.4.0.0) as an unconditional, free entry point: every
session-end screen offered it, `completeAndBridge` in `use-session-end.ts`
fired regardless of session content, and the launch doc framed it explicitly
as the organic growth loop — "the first time Xolace's value leaves the app,"
pushed to all existing users, no premium mention anywhere in the funnel
(`session_end → bridge_card_seen → bridge_open → draft_generated →
bridge_share`).

**Decision:** Trusted Bridge is folded into kindling as one of the 2–3
model-selected `actionType`s (`docs/paths-v1.md` §2.2/§3.1), not a standalone
session-end offer. It inherits both kindling gates unmodified:

- **Xolace+ only** — same as every other twig (ADR 0009). No free-tier bridge.
- **`supportNeed ∈ {light, active}` trigger** — same as kindling generation
  generally (`docs/paths-v1.md` §1). A session the classifier scores
  `supportNeed: "none"` never offers a bridge, regardless of tier.

The old unconditional entry point is retired, not kept alongside the twig —
`completeAndBridge` / the session-end suggestion card is removed. Tending the
bridge twig is the only way to reach the flow going forward.

**Structural exception to the twig shape.** Every other twig binds
deterministically to *existing* content (§2.3's binder — an `audio_tracks`
row, the sit-with-this exercise). The bridge twig has nothing to bind to: its
own model call drafts a *new* message from session content, and the user
edits it inline before sharing. It is catalogued with `alwaysAvailable: false`
like the content-bound entries, but skips the §2.3 binder entirely — tending
it opens the existing Trusted Bridge sub-flow (intro sheet if `bridgeIntroSeen`
is unset, then compose → edit → native share sheet) rather than resolving to a
track id. `docs/paths-v1.md` §2.3's binding table needs a row for this
actionType noting "no binder — opens its own flow."

**Consent gate is unchanged and still gates on first tend, not first
generation.** `bridgeIntroSeen` (the existing Zustand flag, same
client-once-not-consent-of-record shape as `xolacerPrimerSeen`) still fires
the first time a user actually taps into the bridge twig — kindling has no
generation-time consent step of its own, and this ADR does not add one.

## Why this is worth recording

Reversible in principle — the gate is a boolean check — but not in practice:
every asset already produced (launch copy, funnel definitions, the Reddit/
WhatsApp/email campaign) was built around Trusted Bridge as a free growth
mechanic reaching every user on every session. Re-opening it later means
re-litigating whether kindling's "Xolace+ only, no exceptions" line (ADR
0009) survives the one feature that used to justify itself by *not* needing
premium. A future reader hitting `bridge_share` behind a paywall, after
reading the launch doc's "organic only" framing, needs to know this was a
deliberate reversal — not a bug, not a partial rollout.

**Consequence, accepted:** the growth-loop framing in
`docs/launch-1.4.0.0-trusted-bridge.md` is now historical, not current
behavior. Do not treat that doc as the live spec for Trusted Bridge's entry
point or gating — `docs/paths-v1.md` is.

Recorded in `CONTEXT.md` under "Trusted Bridge folds into kindling".
