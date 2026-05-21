# TODOS

Items deferred from CEO/Eng reviews. Each entry has context to pick it up cold.

---

## P2 — Feedback Analytics Dashboard

**What:** Build a PostHog dashboard tracking gave_up rate (gave_up events / total sessions), mirror_miss rate (mirror_miss events / clarification attempts), and top selectedOption distributions for gave_up and mood_heavier.

**Why:** The feedback mechanism PR (feat(feedback-mechanism)) collects the data but has no consumer. Without a dashboard, feedback is noise. The gave_up rate is your primary AI quality metric — it tells you whether model improvements are actually reducing failure.

**How to start:** PostHog → Insights → create Trend chart for `feedback_submitted` filtered by `type = gave_up`. Divide by total `session_completed` events. ~15 minutes of PostHog config.

**Effort:** S (PostHog UI only, no code)
**Priority:** P2
**Depends on:** feedback mechanism PR shipping + ~2 weeks of data collection before the chart is meaningful.

---

## P2 — App Store Review Prompt (lighter mood trigger)

**What:** Call `StoreReview.requestReviewAsync()` from `expo-store-review` when a user selects "lighter" at session end. The OS enforces a 30-day throttle automatically.

**Why:** "Lighter" is the highest-trust, most grateful moment in the app. Users who feel better after a session are the most likely to leave a genuine positive review. The `activity-variant.tsx` file will already be touched by the feedback mechanism PR — adding this is 5 lines.

**How to start:** `npx expo install expo-store-review`. In `activity-variant.tsx`, after `selectedMood === 'lighter'` selection: `StoreReview.isAvailableAsync().then(ok => ok && StoreReview.requestReviewAsync())`. Wrap in a try/catch. Test on device (simulator won't show the dialog).

**Effort:** S (human ~2h / CC ~10min)
**Priority:** P2
**Depends on:** feedback mechanism PR (activity-variant.tsx already touched)

---

## P2 — Deep link escalation state → crisis-resources screen

**What:** When the AI-triggered escalation state's "Yes, show me some resources" button is tapped, navigate to the standalone `crisis-resources` route instead of (or in addition to) showing the inline resource list. This unifies all crisis resource access through one screen.

**Why:** After `feat(crisis-resourses-ui)` ships, there will be two places resources are shown: the in-session escalation state (inline) and the new crisis-resources screen (richer, country-aware, with emergency call button). The inline list will become a worse experience over time as the crisis screen grows. Deferred because touching the reflect state machine mid-session navigation is risky and was explicitly out of scope for the crisis screen MVP.

**How to start:** In `escalation-state.tsx`, replace the inline `resources` section with a `router.push('/crisis-resources')` call when "Yes, show me some resources" is tapped. Audit whether the session state machine in `use-reflection-machine.ts` needs to handle mid-session navigation (it likely needs to call `onDismiss()` before pushing). Test the full reflect → escalation → crisis screen → back → session continues flow.

**Key files:** `src/features/reflect/components/states/escalation-state.tsx` (line 131 — the "Yes, show me resources" Pressable), `src/features/reflect/hooks/use-reflection-machine.ts`, `src/app/(protected)/crisis-resources/` (`_layout.tsx` + `index.tsx`)

**Effort:** M (human ~4h / CC ~30min)
**Priority:** P2
**Depends on:** `feat(crisis-resourses-ui)` shipped

---

## P3 — Adaptive Tone Learning (Mirror Tone Phase 2)

**What:** Make the "Adaptive" tone genuinely adaptive to the individual user over time, not just to their writing style in the current session. Track which tone users manually switch to and feed that signal back into the adaptive prompt so the mirror drifts toward their preferred register without them having to think about it.

**Why:** The current "Adaptive" tone reads the user's writing style within the session. But if a user consistently switches to "Witnessed" after their first few sessions, the adaptive mode should pick that up. This closes the loop between explicit tone preference and the default experience. Deferred because it requires storing per-session tone signals and deciding the averaging/drift algorithm — a design problem that needs more usage data from the new "Witnessed" tone first.

**How to start:** After `feat(mirror-tone-witnessed)` has shipped and you have 2-4 weeks of `tone_changed` PostHog data — look at the distribution. If >30% of users switch to "Witnessed", that's signal the default should shift. The technical implementation: store `toneUsed` on each session in Convex, then in `context.ts` (which builds the `patternSummary`) include the tone distribution, and update the "adaptive" prompt case in `getToneInstructions()` to accept a `preferredToneSignal` parameter.

**Key files:** `convex/sessions.ts` (add `toneUsed` field), `convex/ai/context.ts` (include tone signal in pattern summary), `convex/ai/prompts/articulator.ts` (adaptive case reads signal)

**Effort:** L (human ~1 week / CC ~2h)
**Priority:** P3 (data-dependent — needs usage data from Witnessed tone first)
**Depends on:** `feat(mirror-tone-witnessed)` shipped + 2-4 weeks of PostHog data on tone adoption

---

## P3 — Tone Shown in Session Timeline

**What:** When users review past sessions in the timeline, show which mirror tone was active for that session. A small chip or label — "Witnessed", "Poetic" — next to the session entry or inside the session detail view.

**Why:** Closes the discoverability loop: tone is visible in settings, visible on the mirror screen (indicator badge), and visible in history. Users who want to understand why a session felt different can see the tone was different. Also useful for the team to correlate tone with session completion and mood outcomes.

**How to start:** Add `toneUsed: v.optional(v.string())` to the sessions table in `convex/schema.ts`. Write `toneUsed` when the session's mirror is generated (`convex/sessions.ts` or `convex/ai/process.ts`). Display in `src/features/timeline/` session list and `timeline/session/[id]` detail view.

**Key files:** `convex/schema.ts`, `convex/sessions.ts`, `convex/ai/process.ts`, `src/features/timeline/` (list + detail)

**Effort:** S (human ~3h / CC ~20min)
**Priority:** P3 (nice-to-have, low urgency)
**Depends on:** `feat(mirror-tone-witnessed)` shipped

---

## P2 — Mirror Reflection Sharing (acquisition growth loop)

**What:** Add a share button to the mirror state and session end screen. Generate a shareable deep link that shows the AI reflection to anyone — no account required to view. Recipients get a 3-session trial and are prompted to create an account after session 1.

**Why:** The highest-leverage acquisition action available. Users already share feelings on WhatsApp — giving them a way to share what Xolace said about their feeling brings a receiver directly into the product experience. One shared mirror is more convincing than any ad. Sequenced after quotes because quotes have proven WhatsApp demand now; mirror sharing has higher acquisition impact but larger build.

**How to start:** (a) Add a shareable URL/deep-link route (unauthenticated mirror view). (b) Implement a guest-session token system — receiver views shared reflection with no account. (c) After completing session 1 as guest, prompt to create account for remaining 2 trial sessions. (d) Add share button to mirror state and session-end screen in `src/features/reflect/components/states/`.

**Key files:** `src/features/reflect/components/states/mirror-state.tsx`, `src/app/(protected)/session-end/`, `convex/sessions.ts` (guest token), `src/app/share/[id].tsx` (new unauthenticated route)

**Effort:** L (human ~1 week / CC ~3h)
**Priority:** P2
**Depends on:** daily-quotes PR shipped (deliberate sequencing — quotes first)

---

## P3 — Home Screen Widget (WidgetKit + AppWidget)

**What:** iOS WidgetKit + Android AppWidget showing today's session-derived quote (or preference-curated fallback) on the home screen. The quotes PR writes the session-derived quote to an iOS shared app group container (`group.com.xolaceincorg.xolace`) as forward-compatibility — the widget reads from there without a network call.

**Why:** Home screen presence turns a passive install into a daily ambient touchpoint. Deferred because WidgetKit/AppWidget require native code (Swift/Kotlin) that can't be done in JavaScript — needs a custom native module or Expo config plugin. Right idea, wrong time to build relative to core quotes feature.

**How to start:** iOS: Add a Widget Extension target in Xcode reading from the shared app group container written by the quotes PR. Android: AppWidget reading from SharedPreferences. Both display quote text + Xolace logo + "Open app" tap target. The data layer is already in place from the quotes PR — only the widget UI shell needs building.

**Key files:** iOS: `ios/XolaceWidget/` (new WidgetKit extension). Android: `android/app/src/main/java/.../XolaceWidget.kt` (new AppWidget receiver). Data: written by `convex/jobs/quotesDistiller.ts` → iOS shared app group / Android SharedPreferences.

**Effort:** L (human ~1 week / CC: not applicable — requires native IDE build)
**Priority:** P3
**Depends on:** daily-quotes PR shipped (widget reads data written by that PR)

---

## P2 — Quotes Cron: Anthropic Cost Ceiling (add at 500+ MAU)

**What:** Add an env-var gate (`QUOTES_MAX_DAILY_CALLS`) to the nightly quotes cron. Before dispatching per-user Anthropic calls, check a counter. If the daily ceiling would be exceeded, stop scheduling session-derived generation for remaining users (preference-curated still runs — no AI cost). Log when ceiling is hit.

**Why:** The nightly cron makes 1 Anthropic call per active user with sessions in the last 7 days. At 75 users it's negligible. At 500-1,000 MAU, it becomes a predictable nightly cost. The Anthropic SDK's built-in retry behavior (`maxRetries: 4` in this project) could amplify failures. Without a ceiling, a spike in active users or a partial retry storm could 4x expected API spend overnight.

**How to start:** In `convex/jobs/quotesDistiller.ts`, before dispatching `generateForUser`: check a daily counter document in a `quoteCronStats` or `system` collection, increment per dispatch, short-circuit if over `parseInt(process.env.QUOTES_MAX_DAILY_CALLS ?? "9999")`. Reset counter at midnight in the same cron. Set `QUOTES_MAX_DAILY_CALLS` to a comfortable multiple of current active users.

**Effort:** S (human ~2h / CC ~15min)
**Priority:** P2 — not blocking at 75 users; activate before 500+ MAU
**Depends on:** daily-quotes PR shipped

---

## P2 — Notification Permission Refactor (contextual ask, not at sign-in)

**What:** Move the notification permission request away from the immediate post-sign-in flow. Instead, ask for notification permission in two contextual moments: (1) after preference setup on the quotes screen ("Get your daily quote at the right time"), and (2) after a session completes ("Want a reminder the next time you need this?"). Remove the current sign-in-time ask.

**Why:** Asking for notification permission immediately at sign-in is a dark pattern — the user has no context for why the app would notify them. Cold-asks see 20-40% acceptance; contextual asks see 60-80%. The quotes feature introduces the first genuinely meaningful notification (daily quote at chosen time) — that's the right moment to ask.

**How to start:** Find the current notification permission call in the auth/onboarding flow. Remove it. The quotes preference setup flow (2-step mini-onboarding sheet) handles the new ask at step 2. Ensure the post-session notification ask (if implemented separately from quotes) uses `expo-notifications`' `requestPermissionsAsync()` only at those moments.

**Key files:** Auth/onboarding flow (find current permission ask), `src/features/quotes/components/preference-setup-sheet.tsx` (new, step 2), `src/app/(protected)/session-end/` (optional: post-session nudge)

**Effort:** S (human ~2h / CC ~15min)
**Priority:** P2
**Depends on:** daily-quotes PR shipped (preference setup flow is the primary new ask location)

---

## P3 — Reduce-motion support (crisis screen priority)

**What:** Honor the iOS/Android "reduce motion" accessibility setting on EaseView animations throughout the app. The crisis resources screen is the highest-priority candidate because it's the most emotionally loaded screen — animated entrances that feel calming at normal settings could feel overwhelming for a user who has reduce motion enabled.

**Why:** `AccessibilityInfo.isReduceMotionEnabled()` is a React Native API. EaseView animations can be conditionally disabled by checking this flag. The crisis screen's 500ms fade-in entrance animation is gentle but should still respect user preference.

**How to start:** `AccessibilityInfo.isReduceMotionEnabled()` → store in a context/hook. In `crisis-resources-screen.tsx`, pass `animate={{ opacity: reduceMotion ? 1 : ..., translateY: 0 }}` or `transition={{ duration: reduceMotion ? 0 : 500 }}` to EaseView. Then extend to other screens.

**Key files:** `src/features/crisis-resources/components/crisis-resources-screen.tsx` — the EaseView wrappers for the header block and resource items.

**Effort:** S per screen, M for app-wide adoption
**Priority:** P3 (accessibility debt, not blocking)
**Depends on:** `feat(crisis-resourses-ui)` shipped
