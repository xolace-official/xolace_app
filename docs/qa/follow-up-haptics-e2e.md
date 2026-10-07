# Follow-up haptics & save acknowledgment — E2E flow and device check (#501)

The repeatable artifact for #498 (#499, #500) is the Argent flow suite in
`.argent/flows/follow-up*.yaml`. Each case is its own e2e flow: it relaunches
the app and seeds its own card, so any one can be run alone. Haptics are not
machine-verifiable; they are a manual check on hardware, recorded below.

**Run:** 2026-10-06 · iPhone 17 Pro sim (iOS 26.5) · `com.xolaceincorg.xolace.dev` · dev deployment · Argent 0.22.0 · `e635bc2` · `argent flow run follow-up` → **PASS, 225 steps, 0 failed**.

## How to repeat

```sh
argent flow run follow-up --device <booted-sim-udid>               # the whole suite
argent flow run follow-up-save-failure --device <booted-sim-udid>  # one case
```

Needs: the dev build signed in to the dev account, Metro up (Dev tools render
under `__DEV__`, and the failure case evaluates in Hermes through Metro), and
`DEV_TOOLS_ENABLED` on the dev deployment for **Seed follow-up · standard**.

Taps on the check-in are raw points (the pushed screen is missing from the
flow's native hierarchy, see `starter-suggestions-e2e.md`), measured on an
iPhone 17 Pro. Re-measure with `describe` on another device class.

## Cases

| Flow | Case | Asserts |
|------|------|---------|
| `follow-up-open` (fragment, used by every case) | Open a Follow-up | Seeds a standard card, goes home, the check-in takes the screen with all four chips |
| `follow-up-chips` | Chip → matching next step | lighter → "Good to hear. What helped?" + Done; still_here → its headline; heavier → its headline; processed → its prompt + milestone line |
| `follow-up-saved` | Saved note acknowledged | Private (lighter, switch value 0) → "Saved.", no "shared anonymously", sheet closed. Shared (processed, switch flipped to 1) → "Saved and shared anonymously.", sheet closed |
| `follow-up-quiet-exits` | No toast on quiet exits | Empty Done, Skip for now, X on the step, X on the picker: each lands home with no "Saved" / "Couldn't save" toast |
| `follow-up-save-failure` | Failed save keeps the note | Next `followUpResponses:record` rejected once → "Couldn't save that. Try again?", still on the step, box still holds the typed note, no "Saved."; retry then saves and closes |

### How the failure is forced

No app code. A `debugger-evaluate` step patches
`ConvexReactClient.prototype.mutation` so the next call to
`followUpResponses:record` rejects, then restores itself. The flow's `launch`
restarts the JS runtime, so a stale patch can't leak between runs. Match on
`ref[Symbol.for("functionName")]`: `String(ref)` throws on Convex's
function-reference proxy, which would fail every mutation, not just one.

### Side effects on the dev deployment

Each run writes `follow_up_responses` rows, and the shared case schedules
`followUpShare` with a QA note ("Talking it through with a friend"), so that
line can reach the dev peer pool.

## Manual haptics check (hardware)

Not done yet. Needs a person holding the phones; a simulator can't prove how a
pattern feels. Fill in and tick the matching boxes on #501.

| Check | iPhone (model / iOS) | Android (model / version) |
|-------|----------------------|---------------------------|
| Entry cue (`bellToll`) plays once on open, any tier | | |
| Soft tap on every option card (chips, vent, doorways, Done) | | |
| Affirmative haptic on a saved note | | |
| Error haptic on a failed save | | |
| Skip / X / empty Done: no extra haptic beyond the card tap | | |
| Card tap + affirmative save feel stacked? | | |

**`bellToll` vs `chime` vs `ascent`** (Pulsar preset playground on device):
_verdict pending._ A swap is one word in `src/lib/haptics/haptics.ios.ts` and
`src/lib/haptics/haptics.ts`.

To force the error haptic on hardware, run `follow-up-save-failure` against
the phone with a dev build on Metro. Airplane mode won't do it: Convex queues
the mutation until it reconnects instead of rejecting it.
