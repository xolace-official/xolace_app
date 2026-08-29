# PROTOTYPE — Founder message full-screen (Wayfinder T5 / #236)

**Throwaway.** Answers: _what should the post-signup, full-screen (form-sheet-style)
founder message look like?_ Reference idea from the founder was
`src/components/extras/sample-codes/biscuit-camera` (marquee of shaped cards +
letter + CTA).

## Verdict (#236 review)

**"Campfire Stack" chosen.** Full-bleed horizontal marquee band on top, founder
letter scrolls beneath with gradient fades, pinned solid CTA. (Two other
directions — a static centred "Portrait Card" and a side-by-side "Ambient Drift"
with a vertical marquee — were rejected.)

**Shapes:** nothing that eats the photo (no pointed ovals, no crescent). One
card per shape — no duplicates. Final set in `clip-paths.ts`: `circle`,
`roundedRect`, `flower` (all three from the biscuit-camera sample), `portal`
(doorway arch), `blob` (soft squircle). 5 shapes → 5 cards.

## Run

Dev only. Sign in, then open:

- deep link: `xolace://founder-message-prototype`
- or: `router.push('/founder-message-prototype')`

Floating bar toggles `?user=new|existing` (T3/#234 keys this on
`emotional_profiles.sessionCount > 0`).

**Copy model (founder note):** ONE founder message, shown to everyone and coming
*before* the questionnaire (map #229 sequence). Returning users see the same
message plus a highlighted callout block ("since you've been here…") slotted
between the heart of the letter and the hand-off line — not a separate shorter
screen. Main copy + callout in `letter-copy.ts`; both are placeholders for the
founder to rewrite.

## Still open (discuss, not built)

- Dismiss / re-read later: flow is commit-only (map #229: no skip). Reachable
  again from settings afterward, or not at all?
- Auto-drift speed / motion budget.
- Returning-user copy: warmth vs length.

## Folding in

Winner → a real `src/app/(intake)/` screen (rewritten to production standards —
this was built under prototype constraints). Then delete this directory + the
`src/app/(protected)/founder-message-prototype.tsx` route.
