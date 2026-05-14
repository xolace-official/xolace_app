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
