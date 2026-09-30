# Follow-up v2 — QA sign-off (#454)

Manual Argent walk of the full-screen follow-up check-in (#445) after #447–#453.
No E2E harness yet, so this file is the repeatable procedure + the evidence.

**Run:** 2026-09-29 · iPhone 17 Pro sim (iOS 26.5) · `com.xolaceincorg.xolace.dev` · dev
deployment `groovy-mandrill-892` · branch `prototype/follow-up-v2-ui` @ `d2ff0fc`.

## How to repeat

1. Seed a card: `xolace://settings/account` → Dev tools → **Seed follow-up · <tier>**
   (lands `ready`; replaces any active card).
2. `xolace://` → the reflect home opens `/follow-up` straight away.
3. Walk the branch (table below).
4. Unseen-intro state: in the Hermes debugger, set `useAppStore.setState({ musicIntroSeen: false })`
   (found via `__r.getModules()`), then pick **Music** from the heavier menu.
5. Verify the backend with a one-off query on `follow_up_cards` (`userResponse`) and
   `follow_up_responses` (by `cardId`).

## Results

| # | Tier | Path | Screen seen | Landed on | `userResponse` | `follow_up_responses` |
|---|------|------|-------------|-----------|----------------|------------------------|
| 1 | acute | Feeling lighter → **X** | Picker: still_here, lighter, Let it out + "Resources are still here". Step: no share toggle | Reflect home | `lighter` | none (X just leaves) |
| 2 | standard | Feeling lighter → type note → **Done** | Share toggle, disabled until text | Reflect home | `lighter` | text saved, `shareRequested:false` |
| 3 | elevated | I worked through it → **Skip for now** | Milestone line + streak nod + share toggle | Reflect home | `processed` | none |
| 4 | standard | Still sitting with it → **Music** | Acknowledgment + Music / Support audio / Lantern + Not now | Music list (intro seen) | `still_here` | n/a |
| 5 | standard | Got heavier → Talk to someone → Back → **Music** (intro **unseen**) | Support-first menu; crisis resources pushed over check-in, Back returns to menu | Music intro → hold → Music list | `heavier` | `heavierChoice:music` |
| 6 | standard | Got heavier → **Lantern** (intro **seen**) | — | Lantern home, no intro | `heavier` | `heavierChoice:library` |
| 7 | standard | **Let it out** | — | Voice Vent (its own first-use intro, unchanged) | `vent` | n/a |
| 8 | standard | **X** on picker, no answer | — | Reflect home | `dismissed` | n/a |
| 9 | standard | Still sitting with it → **Not now** | — | Reflect home | `still_here` | n/a |
| 10 | standard | Got heavier → **Not now** | — | Reflect home | `heavier` | none |

## Acceptance criteria

- [x] Acute omits `processed` (and `heavier`) — run 1, matches `chipsForTier`.
- [x] All five branches walked end-to-end, correct step + destination — runs 2–7.
- [x] Heavier intro: unseen → intro (run 5), seen → straight to content (run 6).
- [x] Dismissible at every step: picker X (8), step X (1), Skip (3), Not now (9, 10), Done (2), crisis Back (5).
- [x] `vent` unchanged — card resolves `vent`, `router.replace` to Voice Vent (7).

## Notes

- Answer-then-leave never downgrades to `dismissed` (runs 1, 9, 10) — the `answered` ref holds.
- Heavier choices upsert one row per card, so run 5 stored `music`, not `crisis_resources`.
  Both taps are in PostHog (`follow_up_heavier_choice`). This is by design.
- Not covered: Android, the Support audio doorway, the share-on path (left off so no QA
  text entered the peer pool), and the iOS swipe-down gesture.
