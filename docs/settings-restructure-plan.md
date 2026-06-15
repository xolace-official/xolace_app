# Settings Restructure Plan

**Status:** Approved (IA locked 2026-06-15) — not yet implemented
**Tracked in:** `TODOS.md` → "P2 — Settings: Restructure into Per-Section Sub-Screens"

---

## Why

The root `SettingsScreen.tsx` (407 lines) renders everything at once: 13 sections,
~24 rows, 4 animated `Switch`es, and **9 dialog trees** (`ThemePicker`,
`MirrorTonePicker`, `Retention`, `SpaceName`, `Reach`, `QuietWindow`, `Feedback`,
2× `Confirmation`). Every HeroUI `Dialog` mounts a Portal/overlay subtree even
while closed.

Profiling (session `20260612-162522`) measured ~96ms mount / **383 Views in one
commit**. The cost is structural — every new feature lengthens the scroll and the
mount. A single long scroll is also poor IA regardless of speed.

The building blocks are already right: `SettingsRow`, `SettingsSection`, the
`settings/_layout.tsx` stack, and an existing `appearance.tsx` sub-screen. This is
a re-composition, not a rewrite.

---

## Target structure

Root becomes ~6 **nav rows** that push to dedicated sub-screens. Sub-screens
lazy-mount on navigation (Expo Router stacks are lazy). Picker **dialogs become
inline `RadioGroup` lists** on their sub-screen, which removes the Portal trees
from the initial render entirely.

| Root nav row     | Icon                | Sub-screen contents                                                        | Right-side preview |
|------------------|---------------------|----------------------------------------------------------------------------|--------------------|
| Appearance       | `APPEARANCE_ICON`   | Mode (inline radio), color themes (existing), Reduced motion, Night mode, Replay intro | "Dark"   |
| Mirror           | `MIRROR_ICON`       | Tone (inline radio)                                                         | "Witnessed"        |
| Notifications    | `NOTIFICATIONS_ICON`| Gentle reminders, How I reach out, Quiet hours                             | "On" / "Off"       |
| Privacy & Data   | shield              | Share by default, Trusted Bridge, Retention, Delete data, Delete account   | —                  |
| Account          | `ACCOUNT_ICON`      | Sign-in method, Space name, Log out                                        | "Apple"            |
| Follow & Support | heart               | Is Xolace helping?, Follow us, Send feedback                              | —                  |

Root = these 6 rows (one or two thin `SettingsSection` groupings) + the **version
footer**. No dialogs, no toggles, no `useSettings` mega-hook on the root.

**Decision (2026-06-15):** 6-screen split. Privacy & Data absorbs the former
"Reflection Pool" and "Trusted Bridge" single-toggle sections — they live next to
the retention/delete controls users mentally group with "my data." We deliberately
do **not** create a 7th screen for one-toggle items.

The aesthetic is unchanged: same `SettingsRow`, same icon-led rows, same
`SettingsSection` headers, same animations on sub-screens. Only the depth changes.

---

## Component change: a `nav` row variant

Today `value` shows a muted value but no chevron; `chevron` shows an arrow but no
value. The iOS-standard nav row wants both (icon · label · muted current-value ·
chevron). Add a `nav` variant to `settings-row.tsx` (a few lines, reuses the
existing trailing logic) so rows like Appearance can show "Dark ›" as a glanceable
preview.

---

## Convex / data-layer plan

Key fact: **`useQuery(api.preferences.get)` is deduplicated by Convex across every
component that calls it.** Splitting the 331-line `useSettings` into per-sub-screen
hooks adds **zero** extra network subscriptions or server load — each sub-screen
subscribes to the same cached query and only re-renders while mounted.

- Extract the `withOptimisticUpdate` mutation (the notifications-merge logic) into
  one shared **`usePreferenceMutation()`** so it stays single-sourced.
- Split `useSettings` → `use-appearance-settings`, `use-mirror-settings`,
  `use-notification-settings`, `use-data-settings`, `use-account-settings`. Each
  calls `usePreferenceMutation()` + `useQuery(api.preferences.get)` and exposes
  only its slice.
- Root screen needs **no preferences hook** — just static nav rows (+ optionally
  `signInMethod` / `themeDisplay` for previews, one cheap derived read).

No schema changes, no new Convex functions.

**Audit verdict:** the optimistic merge only runs on write; `Switch` animation cost
spreads to 1–2 per sub-screen instead of 4 at once; inline `RadioGroup` removes
every Portal mount.

**Expected result:** root mount ~96ms → ~20ms; each sub-screen pays only its own
(small) cost on demand.

---

## Version footer

At the bottom of the root ScrollView, centered + muted: the **Xolace** wordmark and
`Version {Constants.expoConfig?.version}` — same `expo-constants` idiom already in
`use-version-check.ts`. Make the text `selectable` (useful for support). Optionally
append the build number (`Constants.expoConfig?.ios?.buildNumber`).

⚠️ `app.config.ts` is `1.5.0` but `package.json` is `1.4.0`. The footer should read
`expoConfig.version` (1.5.0 — the real shipped version); reconcile `package.json`
separately.

---

## File-level change list

**New routes** (thin wrappers per the route-screen convention):
- `src/app/(protected)/settings/mirror.tsx`
- `src/app/(protected)/settings/notifications.tsx`
- `src/app/(protected)/settings/data.tsx`
- `src/app/(protected)/settings/account.tsx`
- `src/app/(protected)/settings/follow.tsx`

**New screens** in `src/features/settings/components/screens/`:
- `MirrorScreen`, `NotificationsScreen`, `DataScreen`, `AccountScreen`, `FollowScreen`
- Extend existing `AppearanceScreen` with Mode + Reduced motion + Replay intro

**Modified:**
- `SettingsScreen.tsx` → slim to ~6 nav rows + footer
- `settings-row.tsx` → add `nav` variant
- `settings/_layout.tsx` → register new `Stack.Screen`s with titles
- Convert the 6 picker dialogs to inline `RadioGroup`/list sections (the 2
  delete/logout `ConfirmationDialog`s stay, on the Data/Account sub-screens)

**New hooks** in `src/features/settings/hooks/`:
- `use-preference-mutation.ts` (shared optimistic mutation)
- Per-screen hooks split from `use-settings.ts`

**New component:** settings footer (Xolace + version)

---

## Notes / opinions

- Pure nav rows on root is the right call — native pattern (iOS Settings, Calm,
  Headspace) and it's what unlocks the perf win. Resist keeping toggles on root.
- The inline `RadioGroup` conversion is the highest-leverage piece: better UX (no
  modal interruption for a 3-option choice) and where most of the 383-View cost lives.
