# Starter suggestions — recorded E2E flow (#465)

The repeatable artifact for Starter suggestions (#459–#464) is the Argent flow
suite in `.argent/flows/`. Each case is its own e2e flow: it relaunches the app
and sets its own state, so any one can be run alone.

**Run:** 2026-09-29 · iPhone 17 Pro sim (iOS 26.5) · `com.xolaceincorg.xolace.dev` · dev deployment · Argent 0.22.0 · `argent flow run starter-suggestions` → **PASS, 322 steps, 0 failed** (22 skips are `when:` blocks not entered). `starter-intake-order` and `starter-session-user` re-run green after the Dev tools rows moved into `starter-dev-rows.tsx` (session-user again after gaining its positive control).

## How to repeat

```sh
argent flow run starter-suggestions --device <booted-sim-udid>   # the whole suite
argent flow run starter-rows --device <booted-sim-udid>          # one case
```

Needs: the dev build (`com.xolaceincorg.xolace.dev`) signed in to the dev
account, with Metro up so `__DEV__` Dev tools render. Also `DEV_TOOLS_ENABLED`
on the dev deployment (for `starter-no-stack`'s seeded follow-up).

### How a flow makes a "new user"

OAuth-only sign-in means a flow can't create a zero-session account. Instead,
Dev tools (Settings → Account) has two idempotent rows:

- **Starter suggestions · as new user** clears the seen flag, resets the
  Reflect tour, and sets `devStarterEligible`, which `useStarterSuggestions`
  honours only under `__DEV__` as "treat this account as zero-session". Then it
  returns home.
- **Starter suggestions · real gate** clears the seen flag and turns the
  override off, so eligibility is the server's `sessionCount` again.

So the zero-session cases exercise the override, not the server gate. Check the
real gate once on a device with a fresh account.

## Cases

| Flow | Case | Asserts |
|------|------|---------|
| `starter-arm` (fragment, used by every case) → `starter-tour-then-bubble` | Appears after the tour | Tour steps 1–4 show with no bubble over them; the bubble appears after **Done** |
| `starter-rows` | Each row's destination | Reflect → composer opens (nothing submitted); Vent → voice vent; Lantern → Library home; Listen → Browse; Xolacer chat → Connect's Xolacer roster (not a conversation) |
| `starter-resolve-sticks` | Never returns after resolving | ✕, tap-away and a row tap (Listen) each resolve it; after a cold relaunch it stays hidden |
| `starter-force-quit` | Returns after force-quit | Killing the app with the bubble open brings it back on the next launch |
| `starter-session-user` | Session user never sees it | Positive control first (the bubble does show when armed as a new user); then on the real gate, with the seen flag cleared, the dev account (sessions > 0) sees no bubble, before or after a cold launch |
| `starter-no-stack` | No stacked sheets | With a follow-up card due, the check-in shows alone (no tour, no bubble). After closing it, the tour runs, then the bubble. Only the follow-up link is exercised: Return welcome and Monthly event have no Dev tools seed that shows them on home |
| `starter-intake-order` | Intake ordering | The dev account's intake has a no-words `emotionAwareness`, so the order is Vent, Lantern, Listen, Xolacer chat, Reflect (each row asserted after the one before). The flow doesn't set intake, so it depends on that account's answers |

## Gotchas found while recording

- **Tab and pushed screens are missing from the flow's full native
  hierarchy.** Browse, Connect and the follow-up check-in never match an
  `await:`/`assert:` directive, but `describe` sees them. Those checks use a raw
  `tool: await-ui-element` step, which polls the accessibility tree and still
  stops the run when unmet.
- **The home Reflect tour draws over whatever screen is on top.** A tour left
  pending (an aborted run, or a reset while on Settings) covers Dev tools. The
  "as new user" row goes home itself, and `starter-arm` skips a stale tour
  first. A real user only meets the tour on home, so this only affects testing.
