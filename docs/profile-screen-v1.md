# Profile Screen — v1 Spec

Status: DRAFT — ready to build
Owner: design + eng
Related: `research/insight-features-research.md` (feature catalog, tiers, waves)

---

## 1. Purpose & principles

The profile is the **"you" screen** — not settings, not history (that's the timeline).
It answers one question: *"Who have I been here?"*

It is **emotional identity, not social identity.** This reverses the research doc's
original "no avatar" stance — deliberately — but keeps its spirit:

- The **avatar is a totem, not a face.** It's a mascot figure that sits by the fire
  with you (chosen later from a defined set). No photos, no real-person likeness.
- The **username is private and is a *naming*, not a handle.** There's no social layer,
  so no one else sees it. It's *"what we call you here"* — the sibling of
  `preferences.spaceName` (*what you call the space*). We generate one by default; the
  user can rename it.

Design register: **a quiet room at night, a candle lit.** Calm, typographic, warm.
The one bold thing on the screen is the campfire glow behind the totem. Everything
else stays disciplined. This is *not* a metrics dashboard — three big number-boxes,
colorful stat tiles, and "Share My Stats" are explicitly out (that's the
fitness/social register the brand rejects).

---

## 2. Information architecture (final)

```
┌─────────────────────────────────────────┐
│        ((( warm amber arc halo )))       │  ← SIGNATURE: campfire-light arcs
│             ·  ( totem )  ·              │     totem peeks into the glow
│                                         │
│            Evening, Wren                │  ← custom centered greeting (time-based)
│          By the fire since Jan          │  ← firstSessionAt, muted
│                                         │
│        47 moments   ·   Day 12          │  ← F1 headline · F2 secondary (one line)
│                                         │
│   what keeps showing up                 │
│   [ anxiety ]  [ grief ]  [ confusion ] │  ← F3 soft chips
│                                         │
│   Most of your sessions end lighter.    │  ← F4 — written in the mirror's voice
│   You tend to arrive on Sunday          │  ← F5
│   evenings.                             │
│                                         │
│   ───────── your insights ─────────     │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ This week                       │   │  ← P2 intensity chart, current week real
│   │  ▁  ▃  █  ▅  ▂  ▃  ▁     High    │   │     active day glows amber
│   │  M  T  W  T  F  S  S    Moderate │   │     qualitative y-axis, not 1–10
│   │  Intensity peaked Wednesday      │   │     Mild
│   │  ·········· earlier weeks 🔒 ··· │   │     Minimal   ← blurred premium depth
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │ 🔒 Words that keep finding you   │   │  ← P5 teaser: real words, blurred count
│   │    trapped · invisible · …       │   │
│   └─────────────────────────────────┘   │
│                                         │
│   See all your patterns  →              │  ← door to the (future) insights screen
└─────────────────────────────────────────┘
```

Scroll behavior: single `ScrollView`, `showsVerticalScrollIndicator={false}`. The
header is **custom (not the native iOS large title)** so we control the centered
composition and the arc. Nav bar stays minimal/transparent; a small settings/gear
affordance sits top-right (matches the inspiration and our existing settings entry).

---

## 3. Visual direction

### Signature — the campfire arc halo
Concentric **warm amber arcs** radiating from behind the totem at the top of the
screen (inspiration: the Headspace arc, re-read as firelight). The totem peeks into
the glow. This is the single memorable element; spend the boldness here and keep the
rest quiet.

- Render: stacked rounded arcs / radial gradient using the amber hue family.
  Prefer a Skia radial or layered `View` arcs over a raster asset so it re-tints with
  the active color theme. Respect `reducedMotion` — if motion is on, the glow can
  breathe *very* slowly (≈8s loop, low amplitude); otherwise static.
- The totem image uses `expo-image` (never RN `Image`), sized so it overlaps the
  arc's inner edge ("peeking" into the warmth).

### Color (existing tokens only)
- Background: `--background` (deep warm indigo).
- Campfire amber: `--warning` (commented in `global.css` as *"the campfire color"*)
  and the richer gold `--tone-witnessed` for the arc gradient's hot center.
- **Token add (small):** introduce `--ember` (+ `--color-ember`) rather than
  overloading `--warning` semantically for the glow. Define in every theme's
  light/dark variant from the same amber hue (≈ oklch 80% 0.10 75). One-line add per
  theme file; flagged so it isn't silently reusing a status color.
- Chips (F3): existing chip / `--resonance` treatment, lowercase, soft.
- Intensity bars: low-opacity `--accent` (lavender) for normal periods; the heaviest
  period interpolates to amber (`--warning`). Empty/future periods dimmed.
- Never hardcode hex — `useThemeColor()` for JS values, `className` for the rest.

### Type
- Greeting: large display, Space Grotesk SemiBold/Bold, sentence case.
- "By the fire since" + the two mirror lines (F4/F5): muted (`--muted`), regular
  weight — they should read like the AI mirror, not like stat labels.
- Section label "your insights": small, lowercase, tracked, muted — a quiet divider,
  not a heading shout.
- All text via `AppText` (never RN `Text`).

### Motion
- Entrance: `EaseView` staggered fade + translateY, matching the Settings screens
  (`type: "timing"`, `duration: 280`, ease `[0.455, 0.03, 0.515, 0.955]`, ~60ms
  stagger per block).
- Intensity bars animate height in on first reveal (spring, like the sample
  `single-bar.tsx`).
- Honor `preferences.reducedMotion` everywhere.

---

## 4. Component breakdown

| Block | Source data | Notes / states |
|------|-------------|----------------|
| Greeting | `displayName` + clock + `sessions.sessionMode` | time bands below; always has a name (generated default) |
| "By the fire since" | `emotional_profiles.firstSessionAt` | hide if null (brand-new, pre-first-session) |
| Moments · Streak | `emotional_profiles.sessionCount`, `currentStreak` | one line; streak hidden if 0 |
| Top emotions (F3) | `emotional_profiles.dominantEmotionTags` | show ≤3 chips; hide section if empty |
| Mood line (F4) | `sessions.postSessionMood` (last 10) | compute lighter/same/heavier majority → one sentence; needs ≥3 with a mood set, else hide |
| Rhythm line (F5) | `emotional_profiles.typicalUsagePattern` | only populated after 5+ sessions; hide until then |
| Week chart (P2 teaser) | `emotional_metadata.intensity` joined to `sessions` (current week) | qualitative y-axis (Minimal/Mild/Moderate/High); active day amber; earlier weeks blurred + 🔒 |
| Words teaser (P5) | `emotional_metadata.userLanguageTags` (recent) | show 2–3 real words, blur the counts; 🔒 |
| "See all your patterns →" | — | routes to insights screen (Wave 2); for v1 can route to a "coming soon" or be hidden behind a flag |
| Settings gear (top-right) | — | navigates to existing settings stack |

### Time-based greeting bands
| Window (local) | Greeting |
|---|---|
| 08:00–12:00 | **Morning, {name}** |
| 12:00–17:00 | **Afternoon, {name}** |
| 17:00–21:00 | **Evening, {name}** |
| 21:00–05:00 | **Quiet hours, {name}** *(gentle — never "Night," never a scold)* |
| 05:00–08:00 | **Morning, {name}** (early) |

No "Hi" fallback — greeting is always time-based.

---

## 5. Empty & low-data states (important — don't show barren charts)

The screen must feel inhabited from session 0.

- **0 sessions:** no charts, no stats. Show totem + greeting + a single warm line:
  *"This is your space. It fills in as you show up."* The totem **peeks in** with the
  line (inspiration: the mascot-peek device), toned down to Xolace calm.
- **1–4 sessions:** show identity + moments count; chips/lines appear as data crosses
  each threshold (F5 needs 5+). The week chart shows a gentle low-data note instead of
  sparse bars: *"A few more moments and your week starts to take shape."*
- **5+ sessions:** full v1 layout.

Each block self-hides when its data isn't ready (see table) — no empty placeholders.

---

## 6. Data & schema

### Schema (the only v1 addition)
Add to `convex/preferences.ts` schema (user-driven, same home as `spaceName`):

```ts
displayName: v.optional(v.string()),   // generated default; user-editable
avatarId: v.optional(v.string()),      // key into a defined avatar set
```

- Generate a default `displayName` on profile/preferences creation (warm,
  non-clinical word list — e.g. nature/light/quiet vocabulary). Never expose the auth
  identity.
- `avatarId` defaults to a starter totem. The change flow is **out of scope for v1**
  (we only render the current avatar + an edit affordance stub).

### Convex queries (Wave 1 — ~3 new)
All bounded; all gate ownership via `requireAuth()` server-side. Premium depth gated
on the server (return `null` + `premiumRequired: true`, never client-only).

1. `profile.getSummary` — name, avatarId, firstSessionAt, sessionCount, currentStreak,
   dominantEmotionTags, typicalUsagePattern. (reads emotional_profiles + preferences)
2. `profile.getMoodDelta` — last 10 `postSessionMood`, returns the majority bucket.
3. `profile.getWeekIntensity` — current week's per-day average `intensity` (+ which
   day peaked). Earlier weeks gated premium.
4. (P5 teaser) reuse recent `userLanguageTags`; if it requires a scan, defer the
   decay-weighted `topUserLanguageTags` aggregation to Wave 2 per the research and
   show a static teaser for v1.

No new tables for v1.

### Convex components — none required for v1
Checked against `docs/convex-components-analysis.md`. Every v1 query is bounded and
reads already-denormalized profile fields or a single current-week scan, so **no
component is needed to ship v1**:

- `@convex-dev/aggregate` and `@abdssamie/convex-checkpoints` are **Wave 2** installs —
  needed for the *full* constellation (P1), percentile (P15), and milestones (F6), not
  for the bounded teasers on this screen.
- `convex-revenuecat` is the one to **design for now, install later**. The premium
  teasers (P2 history, P5 depth) must gate server-side through a **single
  `hasPremium`-style helper stubbed to a constant** (prod `false`, dev-toggleable),
  returning `null + premiumRequired: true` for locked depth. When RevenueCat is wired
  in Wave 2, swap the stub for `hasEntitlement()` and the gates work unchanged. One
  helper, one call site per teaser — do not scatter the check.

---

## 7. Build notes (conventions)

- **Route:** `src/app/(protected)/profile/index.tsx` — thin wrapper that renders
  `ProfileScreen` (per the route-screen-separation rule).
- **Screen + parts:** `src/features/profile/components/screens/ProfileScreen.tsx`,
  with sub-components colocated under `src/features/profile/components/`
  (`profile-hero.tsx`, `campfire-arc.tsx`, `pulse-row.tsx`, `emotion-chips.tsx`,
  `mirror-lines.tsx`, `week-intensity-card.tsx`, `words-teaser-card.tsx`,
  `insights-link.tsx`). Each distinct UI piece is its own file. Keep files < 200 lines.
- **Hooks:** colocate (`src/features/profile/hooks/use-profile-summary.ts`, etc.) —
  not the top-level `hooks/`.
- **Bar chart:** adapt `src/components/extras/sample-codes/miles-bar-chart` — keep the
  per-week horizontal-scroll + haptic-on-change interaction; recolor to the amber/
  lavender intensity scheme; swap the numeric scale for the qualitative y-axis. For v1
  only the current week is interactive; earlier weeks are the blurred premium teaser.
- **No flip card in v1.** The Airbnb flip is parked as a possible Wave 2 *avatar
  keepsake* (stripped of all metallic/verified/network chrome) — not a v1 element.
- **Primitives:** `AppText`, `expo-image`, `SymbolView` (expo-symbols) for icons,
  `PressableFeedback` for taps, Tailwind `className` by default, `StyleSheet`/inline
  only for values not expressible as tokens. React Compiler is on — no manual
  `useMemo`/`useCallback`/`memo`.

---

## 8. Out of scope for v1 (later waves)

- Avatar *change* flow (picker from the defined set) — render only for v1.
- Full insights screen (Wave 2) and all premium features beyond the two teasers.
- Milestone medallion (F6, Wave 2) — leave a reserved slot.
- Constellation (P1), specificity growth (P3), and the rest — Wave 2.
- Weekly/monthly AI summaries (P13/P16), emotional memory (P14), insight video (P17).
- Share / growth mechanics.

---

## 9. Open items to confirm before building

1. `--ember` token name + exact value across all theme files.
2. Default `displayName` word list (tone + length).
3. Where `profile` lives in navigation (tab? settings header? home affordance?) —
   research Open Question 1. Determines discoverability of the whole insight layer.
4. Whether "See all your patterns →" ships hidden behind a flag until the Wave 2
   insights screen exists.
