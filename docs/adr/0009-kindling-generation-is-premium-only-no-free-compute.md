# Kindling generation is Xolace+ only — free users get no compute at all

Kindling (`docs/paths-v1.md`) could have been built as a free feature with a
premium tier on top, or as a "generate for everyone, gate the good actions"
feature. It is neither. **The generation model call, the deterministic binding,
the fallback pass, the `paths` row — none of it runs for a free user.** A free
user who finishes a qualifying session sees one line on session-end pointing at
the Xolace+ paywall ([#218](https://github.com/xolace-official/xolace_app/issues/218)),
and nothing is computed on their behalf.

This was a founder call on the map, and it is load-bearing enough to record.

**Why no free compute.** The map's premium-boundary posture is that kindling is a
Xolace+ trigger moment, not a free feature with paid extras. Every twig binds to
premium content (curated audio, curated music, episodes — all Plus-gated in the
read query per [#272](https://github.com/xolace-official/xolace_app/issues/272)),
so a kindling generated for a free user would be a bundle of things they cannot
open. Generating it anyway spends a model call and a binding pass to produce a
paywall — the upsell line does that for free. The premium check therefore lives
**inside `convex/ai/paths/generate.run`**, at the top, using `hasPremium`
(`convex/lib/premium.ts`): non-premium is an early no-op, not a logged failure.

**Why not "generate, then gate".** Showing a free user a real kindling with
locked twigs was considered and rejected: it is a guilt mechanic (`CONTEXT.md`
"Today" — the product does not ship denominators the user cannot reach), and it
still costs the compute this decision is avoiding.

## Consequences

**The gate is one check in one place.** `generate.run` returns early for
non-premium; there is no per-row `premium` flag on `paths`, `path_steps`, or
`audio_tracks`, because the value would never vary. If a free-tier kindling
surface is ever introduced, that is a new decision and a new field, not a
config flip.

**Free-user cost is a single string.** Session-end exposes a slot (§11 of the
spec); the upsell fills it with one line → the #218 paywall tagged with a
kindling trigger. No sheet, no auto-present (map decision 12). The only
free-user analytics are `plus_upsell_shown` / `plus_upsell_tapped`.

**Downgrade leaves an orphan.** A user who had Plus, generated a kindling, then
let their subscription lapse still has an `active` `paths` row. The
active-kindling screen and its Today row are behind the same premium gate as the
rest of kindling, so they simply stop rendering; the row ages out via the normal
lifecycle (replaced by the next qualifying session while premium, or swept if the
`status: "expired"` fog item is ever built). No special downgrade handling in v1.

**The Browse tab is the deliberate exception.** Free users *can* browse the
catalogue (hub, lists, topic grid) — that is the top-of-funnel for this upsell.
What they cannot do is play a track: the `player` route is `requirePremium` and a
track tap routes straight to the paywall (§9.4). Browsing is not "free compute" —
it is a paginated read of catalogue rows that exist regardless.

**Revisit trigger.** If conversion data shows the blind upsell converts far worse
than a "here's what you'd get" preview would, a *rendered but locked* kindling
for free users becomes worth re-costing — but only against the guilt-mechanic
objection above, which does not expire.
