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

## P3 — Reduce-motion support (crisis screen priority)

**What:** Honor the iOS/Android "reduce motion" accessibility setting on EaseView animations throughout the app. The crisis resources screen is the highest-priority candidate because it's the most emotionally loaded screen — animated entrances that feel calming at normal settings could feel overwhelming for a user who has reduce motion enabled.

**Why:** `AccessibilityInfo.isReduceMotionEnabled()` is a React Native API. EaseView animations can be conditionally disabled by checking this flag. The crisis screen's 500ms fade-in entrance animation is gentle but should still respect user preference.

**How to start:** `AccessibilityInfo.isReduceMotionEnabled()` → store in a context/hook. In `crisis-resources-screen.tsx`, pass `animate={{ opacity: reduceMotion ? 1 : ..., translateY: 0 }}` or `transition={{ duration: reduceMotion ? 0 : 500 }}` to EaseView. Then extend to other screens.

**Key files:** `src/features/crisis-resources/components/crisis-resources-screen.tsx` — the EaseView wrappers for the header block and resource items.

**Effort:** S per screen, M for app-wide adoption
**Priority:** P3 (accessibility debt, not blocking)
**Depends on:** `feat(crisis-resourses-ui)` shipped
