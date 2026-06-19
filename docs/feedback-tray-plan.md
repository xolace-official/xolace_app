# Feedback Tray (Shake-to-Summon) — Implementation Plan

Status: APPROVED (architecture) — ready for P1 build
Branch: `feat(🛹)/add-retray-accessibility`
Author: CEO-review session, 2026-06-19
Source material: `src/components/extras/sample-codes/` (enzomanuelmangano "retray" + shake gesture)

---

## 1. What this is

A **shake-summoned, chrome-free utility tray** for talking back to us: report a bug,
suggest an idea, and (P2) see what's new. The tray is a self-contained surface with its
own internal navigation stack (menu → form → back) — it does **not** touch app navigation
and never routes to real app screens.

Trigger is a **phone shake** (accelerometer), so there is **zero visible chrome on any
screen** — critically, none on the sacred reflect canvas. In dev, a `DevSettings` menu
item fires the same action so we can test without shaking a simulator.

### Why it's on-thesis
- Zero pixels on the canvas. The reflect screen stays sacred; the tray is invisible until summoned.
- Generative, not extractive: a real beta feedback loop, captured at the hottest moment
  (right after a mirror lands is when "that felt off" is most honest).
- Matches the beta posture (we keep console.logs for beta debugging — same instinct).

### Verdict
**Build it.** Adapt the sample engine to our stack. Do **not** port it verbatim and do
**not** try to host it inside `@gorhom/bottom-sheet` (gorhom is built around snap points +
a single content view; animating a short menu ↔ tall keyboard-bearing form with a
back-stack is exactly where it gets janky, and that transition is the whole point here).

---

## 2. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Beneficial? | Yes |
| 2 | Engine | Adapt the sample engine, tailored to our stack (not gorhom, not verbatim port) |
| 3 | Trigger | Phone **shake** (accelerometer), no button, no visible chrome |
| 4 | Trigger scope | Global + state-aware |
| 5 | State gating | Suppress shake only during active `typing` / `typing-nudge` / `processing`. Allowed in `idle`, `mirror`, and all secondary screens |
| 6 | Storage | **New** `product_feedback` Convex table (do NOT reuse the emotional `feedback` table) |
| 7 | Form | One form, `bug` \| `idea` toggle |
| 8 | Discoverability | One-time toast: "Shake your phone anytime to send feedback" (`shakeHintSeen`) |
| 9 | What's New | Deferred to **P2** |

### Why a new table, not the existing `feedback`
`convex/feedback.ts` + the `feedback` table are **emotional** feedback, welded to the
reflection loop (`emotionalProfileId`, `sessionId`, `turnIndex`, types `mood_heavier` /
`mirror_miss` / `gave_up`). Product feedback (bug/idea) is a different domain. Reusing
that table would pollute the longitudinal emotional dataset CLAUDE.md treats as a core
product layer. Separate table = correct separation, not a DRY violation.

---

## 3. Module layout (feature-colocated, per conventions)

```
src/features/feedback-tray/
  engine/                       ← adapted from sample-codes/retray, stack-tailored
    tray-context.tsx            ← RetrayContext → TrayContext (typed screen registry)
    use-tray-navigation.ts      ← lifted ~verbatim (pure reducer, no deps)
    use-keyboard-offset.ts      ← lifted verbatim (keyboard-controller already shipped)
    action-tray.tsx             ← reanimated sheet (drag-to-dismiss + spring + measure)
    tray-backdrop.tsx           ← uses --overlay token, not rgba() literal
    tray-header.tsx             ← SymbolView chevron/close, theme tokens
    debounce.ts                 ← 6-line replacement for lodash.debounce
  screens/
    tray-menu.tsx               ← rows: Report a bug · Suggest an idea  (P2: What's new)
    report-form.tsx             ← bug|idea toggle + TextArea + submit
    whats-new.tsx               ← P2
  trigger/
    use-shake-to-open.ts        ← adapted use-shake-gesture (enabled flag, own debounce)
  feedback-tray-provider.tsx    ← composes engine + screens registry; mounted in RootProvider
  constants/
    whats-new.ts                ← P2 changelog entries (local now, Convex later)

convex/
  productFeedback.ts            ← NEW (camelCase, no hyphen) submit mutation
  schema.ts                     ← + product_feedback table
```

File-size rule (<200 lines) holds — engine files are small; `action-tray.tsx` is the
largest (~150) and stays under.

---

## 4. Conventions translation (sample → ours)

| Sample uses | We use | Reason |
|---|---|---|
| `jotai` atoms | Zustand store flags | Project standard; jotai not in the app |
| `pressto` `PressableScale` | `PressableFeedback` (heroui-native) | Project standard ([[feedback_pressable_heroui]]) |
| `@expo/vector-icons` Ionicons | `expo-symbols` `SymbolView` | Project standard; SVG icon files banned ([[feedback_use_expo_symbols]]) |
| hardcoded hex (`#3A3A3C`…) | theme tokens via `useThemeColor` / className | No hardcoded colors ([[feedback_theme_design_tokens]]) |
| GitHub-issue `Linking.openURL` | Convex `productFeedback.submit` mutation | We have a backend; richer triage |
| `lodash.debounce` | local `debounce.ts` | Avoid a dep for 6 lines |
| raw `TextInput` | `TextArea` (heroui-native) | Project standard ([[feedback_heroui_native_inputs]]) |
| sample's own `GestureHandlerRootView` | (strip it) | RootProvider already provides one |
| `PressablesConfig` global haptics | (skip) | We use heroui PressableFeedback haptics |
| `RetrayThemes.light` (hex theme) | map theme → our CSS variables | Multi-theme system |

Reanimated 4.x: use `.get()`/`.set()`, never `.value` (already how the sample is written —
it uses `.get()`/`.set()` and `scheduleOnRN`/`scheduleOnUI` from `react-native-worklets`,
which we ship at 0.8.3). React Compiler is on, so **no manual `useMemo`/`useCallback`**
except the documented exceptions (context value objects, `try/finally` bodies — the
sample's `dismiss` uses a timeout but no try/finally).

---

## 5. Root integration

Mount `FeedbackTrayProvider` as the **innermost** wrapper around `children` inside
`RootProvider`, i.e. inside `HeroUINativeProvider` (needs heroui toast + PressableFeedback)
and inside `ConvexClientProvider` (needs the mutation). Do **not** add another
`GestureHandlerRootView` / `KeyboardProvider` — both already exist above.

```
GestureHandlerRootView → KeyboardProvider → AppThemeProvider → SessionModeProvider
  → PostHogProvider → ConvexClientProvider → HeroUINativeProvider
      → FeedbackTrayProvider           ← NEW (engine + tray surface + screens registry)
          → {children}
```

The adapted engine `Provider` (from sample `providers/main.tsx`) renders
`{children}` then `<ActionTray>{currentComponent}</ActionTray>` as a sibling, so the tray
floats above the whole app. Theme is wired from `useAppTheme()`/`useThemeColor` rather than
the sample's static `RetrayThemes.light`.

---

## 6. Trigger + state-gating (the clean, no-sync-effect design)

The shake hook `useShakeToOpen({ enabled })` subscribes to the accelerometer only when
`enabled` is true and tears the subscription down otherwise (also unsubscribes on blur via
`useFocusEffect`). It keeps the dev `DevSettings.addMenuItem('💬 Send Feedback')` path.

To gate by reflect state **without** the "sync state into state via effect" anti-pattern
([[feedback_derive_dont_sync_effect]]), use **two pure-derived call sites**:

- **Global default** — mounted in `FeedbackTrayProvider`:
  `useShakeToOpen({ enabled: !isReflectRoute })` where `isReflectRoute` is derived from
  `usePathname()` during render. Covers every screen except reflect.
- **Reflect screen** — `reflect-screen.tsx` already subscribes to the machine:
  `useShakeToOpen({ enabled: screen !== 'typing' && screen !== 'typing-nudge' && screen !== 'processing' })`,
  derived from `state.screen` during render.

No double-fire (global is disabled on the reflect route), no effects mirroring state, each
`enabled` computed during render.

```
        shake (accel speed > threshold, debounced 500ms leading)
                         │   [enabled per call-site, pure-derived]
                         ▼
   ┌─────────────────── TRAY ───────────────────┐
   │  tray-menu ──"bug/idea"──► report-form ──submit──► Convex ─┐
   │     │                          ▲ back                       │
   │     └──"what's new" (P2)──► whats-new ──► lastSeenVersion   │
   └──────────────── drag-down / backdrop-tap ──► dismiss ◄──────┘
```

### Discoverability toast
First time the trigger is eligible (any allowed state/screen) and `!shakeHintSeen`:
fire one heroui toast — "Shake your phone anytime to send feedback" — then
`setShakeHintSeen(true)`. Never repeats.

---

## 7. Backend

### Schema (`convex/schema.ts`)
```ts
product_feedback: defineTable({
  emotionalProfileId: v.id("emotional_profiles"), // server-derived owner scope
  kind: v.union(v.literal("bug"), v.literal("idea")),
  text: v.string(),                 // 1..1000 chars, validated server-side
  context: v.object({
    appVersion: v.string(),         // from expo-constants / app.config (1.5.0)
    route: v.string(),              // pathname at submit time
    themeName: v.string(),          // active color theme id
    platform: v.string(),           // process.env.EXPO_OS
  }),
  createdAt: v.number(),
})
  .index("by_profile_and_created", ["emotionalProfileId", "createdAt"]),
```

### Mutation (`convex/productFeedback.ts`)
```ts
export const submit = mutation({
  args: {
    kind: v.union(v.literal("bug"), v.literal("idea")),
    text: v.string(),
    context: v.object({
      appVersion: v.string(),
      route: v.string(),
      themeName: v.string(),
      platform: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);     // returns { user, profile, identity }
    const { ok } = await rateLimiter.limit(ctx, "productFeedback", { key: profile._id });
    if (!ok) throw new ConvexError("You're sending feedback too fast. Try again shortly.");
    const text = args.text.trim();
    if (text.length === 0 || text.length > 1000) {
      throw new ConvexError("Feedback text must be 1–1000 characters.");
    }
    await ctx.db.insert("product_feedback", {
      emotionalProfileId: profile._id,
      kind: args.kind,
      text,
      context: args.context,
      createdAt: Date.now(),
    });
    return null;
  },
});
```
Never accept a user id from the client (auth rule). `text` trimmed + length-bounded
server-side regardless of client validation. **Rate-limited** via the existing
`rateLimiter` component (add a `productFeedback` rule next to `generalFeedback`) keyed on
`profile._id` — shake-summoned submission is easy to spam, so this is not optional.

---

## 8. Store additions (`src/store/store.ts`)

Follow the existing per-flag pattern (`introSeen`, `founderWelcomeSeen`, …). Both persisted
(add to the persist allowlist alongside `theme`/`toggles`):

```ts
shakeHintSeen: boolean;
setShakeHintSeen: (v: boolean) => void;

lastSeenVersion: string | null;        // P2 (what's-new badge)
setLastSeenVersion: (v: string) => void;
```

---

## 9. Analytics (PostHog — structural events only, no content)
- `product_feedback_submitted` — `{ kind }`
- `feedback_tray_opened` — `{ source: 'shake' | 'dev_menu', route }`
- `whats_new_opened` (P2)

Per [[project_posthog_convex]]: structural events, no free-text content.

---

## 10. Data flows — happy + shadow paths

| Flow | Happy | nil/empty | error |
|---|---|---|---|
| Submit feedback | trimmed text → mutation → dismiss + success toast | empty/whitespace → submit disabled; server re-rejects | network/Convex error → **keep tray open**, inline error toast, preserve typed text; catch named `ConvexError`, no silent swallow |
| Shake → open | allowed state → `show('menu')` | already open / same screen → sample `show` no-ops | accelerometer unavailable → guard with `Accelerometer.isAvailableAsync()`, no-op; dev menu still works |
| What's New (P2) | list renders, sets `lastSeenVersion` | no unseen entries → no badge, list still opens | — |

### Interaction edge cases
- **Shake mid-keyboard** (form already open): 500ms leading debounce + same-screen no-op.
- **Rapid repeat shakes**: leading debounce absorbs.
- **Navigate away mid-form**: tray is an overlay, not a route; backgrounding dismisses via
  blur teardown; typed text is lost by design (no draft persistence in P1 — listed in TODOs).
- **Submit double-tap**: disable submit button while the mutation is in flight.
- **Distressed user shakes during `idle`/`mirror`**: allowed by decision #5 — that is signal,
  not noise. Only active `typing`/`processing` are suppressed.

---

## 11. Dependencies & permissions

- **New:** `expo-sensors` (Accelerometer). Install: `npx expo install expo-sensors` (SDK-pinned).
- **Dropped from sample:** `lodash.debounce`, `pressto`, `jotai`, `@expo/vector-icons`.
- **Already shipped (reused):** `react-native-reanimated@4.3.1`, `react-native-gesture-handler`,
  `react-native-keyboard-controller`, `react-native-worklets@0.8.3`, `@gorhom/bottom-sheet`
  (unused here), `expo-symbols`, `heroui-native`, `expo-constants`.
- **Permissions:** iOS accelerometer via `expo-sensors` needs no runtime permission prompt
  (motion permission is for `CMMotionActivity`/pedometer, not raw `Accelerometer`). Verify on
  device; add `NSMotionUsageDescription` only if a prompt appears.
- **Perf/battery:** accelerometer listener runs only while `enabled`; `setUpdateInterval(~100ms)`;
  always unsubscribe on blur and when disabled. Negligible drain when scoped this way.

---

## 12. Phasing

**P1 — the feedback loop (ship first)**
1. `npx expo install expo-sensors`.
2. Adapt engine into `src/features/feedback-tray/engine/` (rename Retray→Tray, strip GHRootView,
   wire theme tokens, swap pressables/icons).
3. `tray-menu` (bug/idea rows) + `report-form` (toggle + TextArea + submit).
4. `product_feedback` table + `productFeedback.submit` mutation.
5. `use-shake-to-open` + two pure-derived call sites (provider global + reflect screen).
6. `FeedbackTrayProvider` mounted in RootProvider.
7. Discoverability toast + `shakeHintSeen` store flag.
8. PostHog events.

**P2 — What's New**
- `whats-new.tsx` + `constants/whats-new.ts` + `lastSeenVersion` badge on the menu row.
- Respect OTA versioning: OTA updates keep the store version; label as "OTA Update (date)"
  ([[feedback_ota_versioning]]).

**P3 — deferred (TODOs)**
- Convex-driven changelog (remote what's-new).
- Screenshot attach on bug reports.
- Draft persistence for in-progress feedback text.
- "Rate the app" row.

---

## 13. Verification (argent MCP, after P1)
- Dev menu item fires tray (sim).
- Tray opens in `idle`/`mirror`, does **not** open during `typing`/`processing`.
- Submit writes a row (check Convex dashboard `product_feedback`), success toast, dismiss.
- Network-off submit keeps tray open + shows error + preserves text.
- Discoverability toast shows once, never again after `shakeHintSeen`.
- Theme tokens correct across light/dark + a color theme (e.g. `quiet`).

---

## 14. Open risks
- Accelerometer false-positives in pockets/walking → threshold (`speed > 250`) + leading
  debounce from sample; tune on device.
- Simulator can't physically shake → dev menu item is the primary test path (Device ▸ Shake
  also works on sim).
- Multi-theme correctness — the sample is hardcoded dark; the adaptation must read every color
  from tokens or the tray will look wrong in light/`quiet`/etc.
