# T7 — Intake funnel instrumentation spec

Wayfinder map: [#229](https://github.com/xolace-official/xolace_app/issues/229) · Ticket: [#238](https://github.com/xolace-official/xolace_app/issues/238)

Build-ready spec for instrumenting the `(intake)` flow (founder message → questionnaire →
paywall). Planning artifact — **nothing is wired here**; a downstream build effort
implements this verbatim. Inputs: T1 (question set), T2 (acquisition metric), T3 (schema +
person-property dual-write), T4 (paywall surface), T6 (route architecture + event timing).

---

## 1. Scope

T7 delivers a spec, not built dashboards. Every event name, property, funnel step, cohort,
and dashboard tile below is fixed; the build wires PostHog + client code with zero open
questions.

All funnel events are **client-side**, fired from the `(intake)` screens off the
non-persisted Zustand `intake` slice (T6). The one server touchpoint — the `intake.complete`
mutation (T6) — stays analytics-free; `intake_completed` fires client-side after that
mutation's promise resolves.

Naming follows repo convention: `intake_*` prefix (cf. `vent_*`, `paywall_*`), snake_case
event names and properties, multi-selects as arrays.

---

## 2. Event schema

### 2.1 New events

| Event | Fires when | Properties |
|---|---|---|
| `intake_started` | founder screen (`(intake)/index`) mounts | `session_count` (number), `is_returning_user` (bool, `session_count > 0`) |
| `intake_step_viewed` | any paged unit becomes visible — founder, every question, every interstitial, both series screens, paywall | `step_key` (enum, §2.3), `step_index` (number, 0-based position in the full ordered flow), `step_type` (`founder` \| `question` \| `interstitial` \| `paywall`), `section` (`you` \| `how_you_carry_it` \| `finding_us` \| `null`) |
| `intake_question_answered` | user commits an answer and advances off a question step | `question_key` (enum, = the question's `step_key`), `question_index` (number), `value` (string for single-select, `string[]` for multi), `is_multi` (bool), `selection_count` (number, multi only; omit for single), `declined` (bool — `value` is `prefer_not_to_say` or the array contains it) |
| `intake_questionnaire_completed` | last question of §3 answered, before the entitlement-skip branch | `duration_ms` (number, since `intake_started`), `declined_count` (number of questions answered `prefer_not_to_say`), `branched_series` (bool — `acquisition_source === "short_form_video"`) |
| `intake_paywall_skipped` | questionnaire completion handler, when `usePlusEntitlement().isPlus === true` | `reason` (`"active_entitlement"`) |
| `intake_completed` | client-side, after the `intake.complete` mutation promise resolves — both paywall exits and the entitlement-skip path | `outcome` (`purchased` \| `dismissed_paywall` \| `skipped_paywall`), `duration_ms` (since `intake_started`), `branched_series` (bool) |

### 2.2 Reused events (no new events for the paywall)

The intake paywall renders `<PaywallScreen surface="intake" />`, which already fires:

- `paywall_opened { surface: "intake", session_count }` — on mount
- `paywall_dismissed { surface: "intake" }` — on the close button
- `purchase_started` / `purchase_completed` / `purchase_failed` `{ package, surface: "intake" }` — from `revenuecat-context`

**`surface: "intake"` is authoritative.** T2's resolution text said `surface: "onboarding"`;
T4 locked the `PaywallSurface` union value as `"intake"` and the vocabulary is "intake".
T7 ratifies `"intake"` everywhere; `"onboarding"` is not used.

No `acquisition_source_selected` event. T2 named it as "an independent funnel entry point and
timestamp," but in this model `intake_question_answered { question_key: "acquisition_source" }`
already carries the value + timestamp and `intake_step_viewed { step_key: "acquisition_source" }`
is the funnel entry point. **T7 overrides T2 and drops the separate event** — one event schema,
no special case for Q9.

### 2.3 `step_key` taxonomy

Canonical ordered list (drives `step_index`):

| `step_index` | `step_key` | `step_type` | `section` |
|---|---|---|---|
| 0 | `founder` | `founder` | `null` |
| 1 | `username` | `question` | `you` |
| 2 | `intent` | `question` | `you` |
| 3 | `weighing_on` | `question` | `you` |
| 4 | `interstitial_privacy` | `interstitial` | `null` |
| 5 | `emotion_awareness` | `question` | `how_you_carry_it` |
| 6 | `disclosure_style` | `question` | `how_you_carry_it` |
| 7 | `coping_style` | `question` | `how_you_carry_it` |
| 8 | `support_frequency` | `question` | `how_you_carry_it` |
| 9 | `interstitial_feedback_awareness` | `interstitial` | `null` |
| 10 | `age_bracket` | `question` | `finding_us` |
| 11 | `acquisition_source` | `question` | `finding_us` |
| 12 | `series_seen` | `question` | `finding_us` |
| 13 | `series_want_in_app` | `question` | `finding_us` |
| 14 | `paywall` | `paywall` | `null` |

`series_seen` / `series_want_in_app` steps only fire when
`acquisition_source === "short_form_video"` (T1's only branch). `username` fires
`intake_step_viewed` but its `intake_question_answered` carries no sensitive `value` — record
`value: "accepted_suggested"` or `value: "edited"` (whether the user kept the auto-handle),
never the handle string.

---

## 3. Person-property dual-write (consolidated)

Fires in the existing identify hook path (`src/lib/use-posthog-identity.ts`), **split to
questionnaire submit, client-side** (T6) — this is what makes the channel-attributed paywall
funnel free, since `paywall_opened` then already carries the person's `acquisition_source`.

This table supersedes the scattered mentions in T2 and T3.

| Person property | Source question | Type | Mode |
|---|---|---|---|
| `acquisition_source` | Q9 | string enum | `$set_once` |
| `series_seen` | Q10 | string enum | `$set_once` |
| `series_want_in_app` | Q11 | bool | `$set_once` |
| `intent` | Q2 | string enum | `$set` |
| `weighing_on` | Q3 | string[] | `$set` |
| `emotion_awareness` | Q4 | string enum | `$set` |
| `disclosure_style` | Q5 | string enum | `$set` |
| `coping_style` | Q6 | string[] | `$set` |
| `support_frequency` | Q7 | string enum | `$set` |
| `age_bracket` | Q8 | string enum | `$set` |
| `intake_version` | — | number | `$set` |

- **`$set_once`** — immutable historical facts. A re-onboard / reinstall / deliberate
  intake re-run must never overwrite them.
- **`$set`** — a deliberate intake re-run (a considered migration that flips
  `onboardingComplete` back to `false`) *should* refresh these.
- Backfill: the identify hook reads answers back from `getFullContext` on next app open, so
  installs that never re-run intake still populate these (same mechanism already used for
  `auth_provider`).
- `preferences.displayName` (Q1 username) is **not** a person property — it is not
  segmentation signal.

---

## 4. Funnels

### 4.1 Intake Funnel (primary)

Ordered steps:

1. `intake_started`
2. `intake_step_viewed` where `step_key = intent` (first real question — proves they
   entered the questionnaire)
3. `intake_questionnaire_completed`
4. `paywall_opened` where `surface = intake` **OR** `intake_paywall_skipped` (OR-step keeps
   entitlement-skippers in the funnel instead of reading them as paywall abandonment)
5. `intake_completed`

**Breakdowns:** `acquisition_source` (free — captured before the paywall) and
`is_returning_user` (existing users run intake too per T3/T5; their drop-off shape differs).

### 4.2 Questionnaire micro-funnel

The `intake_step_viewed` events in `step_key` order (§2.3), steps 1–13. This is where
per-question drop-off reads — since there is no skip button (T1), a drop between step N and
N+1 is an app abandonment on question N.

Series steps (12–13) are only in-funnel for the `acquisition_source = short_form_video`
segment; view this micro-funnel filtered to that segment when inspecting the series branch.

---

## 5. Dashboards

### 5.1 Intake Funnel Health (owner: onboarding / product)

- **Intake Funnel** (§4.1), with the two breakdowns.
- **Questionnaire micro-funnel** (§4.2).
- **Intake answer distribution** — one `intake_question_answered` insight broken down by
  `value`, filtered per `question_key`; rendered as one small tile per question (~10 tiles).
  `weighing_on` and `coping_style` use array-element breakdown so each option counts
  independently.
- **Decline rate by question** — `intake_question_answered` where `declined = true`, broken
  down by `question_key`.
- **Retention by intake answer** (guardrail, §6).
- **Time-to-complete** — `intake_completed.duration_ms` distribution (p50 / p90), broken
  down by `is_returning_user`.

### 5.2 Acquisition by Channel (owner: growth) — from T2

- **Channel mix of new users** — share by `acquisition_source`, weekly trend.
- **Retention by channel** — W1–W4 retention curve split by `acquisition_source`.
- **Paywall conversion by channel** — `paywall_opened` → `purchase_completed` (surface =
  `intake`) split by `acquisition_source`.
- **Word-of-mouth share** (headline single number) —
  `acquisition_source ∈ {friend_family, professional}` as a fraction of new users.
- **Series reach** — % of `short_form_video` users with `series_seen != not_seen`.
- **Series sentiment** — distribution across `loved_it` / `it_was_okay` / `not_for_me`
  (scoped to `short_form_video`).
- **Series in-app demand** — % `series_want_in_app = true` (scoped to `short_form_video`).
  Go/no-go input for the out-of-scope series-hub effort; that effort owns the threshold.

---

## 6. Retention guardrail

Answers decision 5 of the ticket — "whether a given answer predicts churn."

- **Cohorts** — one PostHog cohort per segmentation person-property: `intent`,
  `weighing_on` (contains X), `emotion_awareness`, `disclosure_style`, `coping_style`
  (contains X), `support_frequency`, `age_bracket`, `acquisition_source`.
- **Insight** — a "Retention by intake answer" retention insight (W1 + W4) on the Intake
  Funnel Health dashboard, broken down by each property.
- **Watch cohorts** — eyeball these first:
  `coping_style contains outside_things`, `weighing_on contains a_loss`,
  `emotion_awareness = numb_or_cant_tell` — the same heavy answers T3's first-session
  follow-up floor keys on. If they churn materially worse, the floor is not enough on its
  own.
- **No PostHog alert** on these — too noisy at the low N of the first weeks. Dashboard
  tile + a note to revisit once cohorts populate.

---

## 7. Alarms

Three configured PostHog **alerts**; every other signal is dashboard-only.

| Alert | Metric | Provisional threshold |
|---|---|---|
| Founder drop-off | 1 − (step 2 / step 1) of the Intake Funnel | fire if > 15% |
| Questionnaire completion | `intake_questionnaire_completed` / `intake_started` | fire if < 80% |
| Intake paywall dismiss | `paywall_dismissed` / `paywall_opened` (surface = `intake`) | fire if > 85% |

Thresholds ship provisional and are re-baselined from the first two weeks of real traffic.

---

## 8. Not changed / not needed

- **`CONTEXT.md`** — no change. Event and step-key names are implementation, not domain
  glossary; `CONTEXT.md` is glossary-only.
- **No ADR** — instrumentation is reversible; no hard-to-reverse trade-off.
- **Server mutation** — `intake.complete` stays analytics-free.
- **`posthog.screen`** — the `_layout.tsx` auto-screen call still fires for the three
  `(intake)` route screens (`index`, `questionnaire`, `paywall`); it is left as-is and is
  not part of this funnel (it cannot see the internally-paged sub-steps).

---

## 9. Map effects

No new tickets, no fog graduation, nothing ruled out of scope. T7 is #229's last open
child — resolving it locks the map's spec in full.
