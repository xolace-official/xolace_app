# Follow-Up System — Design

Sessions that leave something unresolved deserve a check-in. This document covers
how the system detects those sessions, what schema changes are needed, how the
Workflow executes the follow-up, and what the user sees.

---

## Prerequisites

- `@convex-dev/workflow` must be installed and registered in `convex.config.ts`
  before any of the backend work here can ship. The Workflow component provides
  `step.awaitEvent`, `step.sleep`, and durable multi-step execution — the core
  primitives this system depends on.

- `@convex-dev/crons` is **NOT** needed. That component is for runtime-dynamic
  crons (register/unregister schedules at runtime). All follow-up timing is
  handled by the Workflow's durable `step.sleep` ladder. The existing native
  `convex/crons.ts` (`cronJobs()` from `convex/server`) is untouched.

---

## Decisions Log (Locked)

Decisions made during eng review. These override anything below that contradicts
them.

| Decision | Choice | Plan impact |
|----------|--------|-------------|
| **Return signal** | App open / foreground, time-gap guarded | `followUps.markReturn` mutation + `MIN_RETURN_GAP`. No "must start a session" requirement — the card surfaces on a later app open even if no new session is started. The gap guard prevents the event from resolving in the same sitting. |
| **Nudge budget** | Separate rate-limit bucket | New `followUpNudge` limit in `lib/rateLimits.ts`. `notifications.schedule` selects the bucket by `type`, so a follow-up nudge never starves (or is starved by) `gentle_return` / `pattern_nudge`. |
| **Card text** | Haiku, async at workflow start | New `followUpCardWriter` prompt + an action. Reuses `ANTHROPIC_API_KEY`, runs off the critical path after the session completes. |
| **Abandon gating** | Gate `abandon` + `checkAbandoned` on escalation | Escalation-then-abandon (user bails at the mirror) is the highest-value check-in. Abandoned sessions carry only `escalationTriggered` (no confirm loop ran), so the gate is just `session.escalationTriggered === true`. |
| **`followUpReason` home** | `emotional_metadata` | Co-located with all other classifier output (it's an analytical annotation, read once at workflow start). `requiresFollowUp` (the operational gate) stays on `sessions`. No query saved by putting it on `sessions` — metadata is loaded at workflow start either way. |
| **markReturn timestamp** | `card.createdAt` | The card is created via `runAfter(0)` the instant the session completes, so `card.createdAt ≈ completion time` (sub-second drift). The plan's `activeFollowUp.completedAt` field does not exist — using it makes the gap guard `NaN` and the feature silently never fires. |
| **`getActiveWorkflow` scope** | `status === "pending"` only | markReturn must not re-send `userReturned` on every open after a card flips to `ready`. The UI's "is there a ready card?" query is separate (`status === "ready"`). |
| **Follow-up nudge gating** | `notifications.enabled` only | Deliberate early-stage choice to be aggressive and gather reaction data: follow-up pushes ignore quiet window and have **no** per-type toggle. No `followUp` preference field is added. (Accepted risk: a 3am escalation push.) |
| **Card-writer failure** | try/catch → `FALLBACK_FOLLOWUP_CARD` | Generate `cardText` defensively; the row + workflow **always** start even on a Haiku outage, so safety-relevant follow-ups are never silently dropped. Mirrors the existing `FALLBACK_MIRROR` pattern. |
| **Return trigger** | Read-side detect, mutate only when needed | Add `hasPendingFollowUp` to the existing `getFullContext` query; the client calls the `markReturn` mutation only when a pending card exists — not a write transaction on every foreground. Pin to the reflect-screen load, not raw `AppState` `active`. |
| **`gave_up` trigger** | Kept as a standalone hard trigger | "The AI couldn't reflect you back" is itself worth a check-in. The card-writer MUST use mirror-free copy for `gave_up` sessions (no resonant mirror to reference). |
| **Supersede policy** | Newest qualifying session supersedes | Cancel the old workflow, set the old card to a new `superseded` status (distinct from `expired`). Superseded cards stay visible/tappable in the profile Follow-Ups section as "unresolved, no check-in coming"; only an explicit user dismiss closes them. Prevents starvation of frequent processors + stale check-ins. |
| **Workflow versioning** | Keep `@convex-dev/workflow`; build stable up front | Parameterize sleep durations as `workflow.start` args (`stage1Ms/stage2Ms/expiryMs`), not in-body constants, so cadence tuning never reshapes the workflow function (deterministic journal replay). Step count/order fixed; changes additive-only; breaking changes drain via the cancel path. |
| **Idempotent transitions** | Conditional `status === "pending"` patch | Multi-device double-foreground or an `awaitEvent`-vs-`sleep(1d)` tie must not both flip-to-ready and send a nudge. A `ready` card is never downgraded to `expired` by the timer. |
| **Eval coverage** | Classifier flag eval this sprint | `requiresFollowUp.eval.ts` (~15-20 labeled inputs, `bun:test`, live Haiku). Card-writer rubric eval deferred to TODOS (fast-follow after first feedback round). |
| **Push content** | cardText in push (Elevated/Standard); recency-anchored, content-free (Acute) | **Explicitly-accepted product risk for Elevated/Standard:** the push body names the wound (e.g. "how's that thing about your mother landing?"), gated only by `notifications.enabled`. **Acute tier is softened** (see "Weight-tiered cadence"): the push references *that* something was processed and *when*, but never names the wound — e.g. *"Just checking in on what you worked through a little while ago. We're here."* The specific cardText + responses appear in-app only. |

### Weight-tiered cadence (added post-review, from user research)

Follow-up timing varies by session **weight**, computed at workflow start by a pure
`followUpCadence(session): Cadence` fn and passed as the `workflow.start` args
(the parameterization from the "Workflow versioning" decision is what makes this
clean — no workflow-shape change). These rows override the fixed `1d/3d/14d`
ladder drawn in the Workflow Architecture diagram below.

| Tier | Trigger | 1st check | 2nd nudge | Expire | Push content |
|------|---------|-----------|-----------|--------|--------------|
| **Acute** | `safeguard.level === "crisis"` | **45 min** | +4h | 48h | recency-anchored, wound-free; card in-app only |
| **Elevated** | `safeguard.level === "elevated"`, or grief/shame `intensity ≥ 7`, or `gave_up` | 12h | +1d | 7d | cardText in push |
| **Standard** | classifier flag, `intensity < 7` | 24h | +3d | 14d | cardText in push |

- **Rationale (Acute):** a fast, warm *presence* check reduces isolation in the
  acute window; a 24h gap reads as abandonment after someone exposed something
  heavy. The follow-up is **not** crisis intervention — the real-time intervention
  remains the escalation resources shown at the mirror (`safeguard.ts`). The Acute
  push is framed as presence, not a processing prompt.
- **Supersede respects weight (revises the Supersede policy):** a new session
  supersedes the active follow-up **only when its tier weight ≥ the active tier**.
  A lower-weight session is skipped (not started), so a casual Standard session
  cannot cancel an active Acute crisis check-in. Equal-or-higher weight refreshes.
  Tier order: Acute > Elevated > Standard.
- **Selectivity (user point 2):** follow-ups are the exception, not the default.
  The classifier prompt defaults `requiresFollowUp` to false and reserves it for
  genuinely unresolved high-stakes moments; combined with one-active-per-profile +
  weight-aware supersede, at most one live follow-up exists per profile at a time.

### Corrections folded in (factual fixes to the sections below)

1. **`requiresFollowUp` is finalized at completion, not at mirror delivery.**
   One of the hard rules is `confirmationState === "gave_up"`, which is only
   known after the clarify loop — later than `deliverMirror`. So `deliverMirror`
   stores the *AI + escalation* flag; the **completion mutation** computes the
   final value: `storedFlag || confirmationState === "gave_up" || escalationTriggered`.

2. **The completion hook is `sessions.completePath` and `sessions.completeSession`.**
   There is no `exitSession` — the exit path goes through `completeSession`.
   Both must gate the workflow start, and the start must be **idempotent**
   (skip if `followUpWorkflowId` is already set / a card already exists).

3. **At most one active follow-up per profile.** `startFollowUpWorkflow` skips
   if a `pending` / `ready` card already exists for the profile. Avoids nudge
   spam and removes the "which workflow do we wake?" ambiguity.

4. **`notification_log.type` AND `notifications.schedule`'s `type` union both
   gain `follow_up`.** The schema diff below only shows `notification_log`; the
   sender (`convex/notifications.ts`) carries its own typed union that must also
   be extended.

5. **Drop the proposed `sessions.by_profile_followup` index** unless a concrete
   sessions-side query needs it. The profile screen reads `follow_up_cards`
   (which already has `by_profile_created`), so the index is write cost for a
   query we don't run.

6. **Workflow IDs use `vWorkflowId` / `WorkflowId`** from the component, not raw
   `v.string()`, on both the `follow_up_cards.workflowId` field and
   `sessions.followUpWorkflowId`.

7. **Privacy cleanup.** `follow_up_cards` rows and any active workflow must be
   cancelled + purged in `jobs/dataWipe.ts` and `jobs/accountDeletion.ts`.
   Use `workflow.start(..., { onComplete })` to reach a terminal card state and
   `workflow.cleanup` so the component's journal tables don't grow unbounded.

---

## Signal Design — How Does a Session Earn a Follow-Up?

Two layers. The AI flag catches the nuanced cases; the hard rules catch the obvious ones.

### Layer 1: AI flag (classifier)

The classifier (Haiku) already reads the full emotional content and outputs
structured JSON. Adding `requiresFollowUp` to that output costs nothing in
latency (same call) and a handful of tokens. The classifier has everything
it needs: the raw input, emotion, intensity, thematic tags, and temporal context.

**Classifier JSON schema addition:**

```diff
{
  "primaryEmotion": string,
  "primaryEmotionConfidence": number,
  "granularLabel": string | null,
  "secondaryEmotion": string | null,
  "intensity": number,
  "specificity": number,
  "thematicTags": string[],
  "userLanguageTags": string[],
  "temporalContext": "past_focused" | "present_focused" | "future_focused" | null,
+ "requiresFollowUp": boolean,
+ "followUpReason": string | null
}
```

`followUpReason` is a brief internal sentence — never shown to the user. It
exists for debugging and future prompt tuning. Example values:

- `"grief theme with high intensity — unresolved loss"`
- `"shame spiral with present-focused temporal context"`
- `"relational conflict with no resolution language"`
- `null` when `requiresFollowUp` is false

**Prompt addition (append to Field Definitions section in classifier.ts):**

```
**requiresFollowUp**: Should the system check in on this person within 24 hours?
true when:
- Grief, loss, or bereavement content — especially when past-focused
- Shame or guilt with intensity ≥ 6
- Relational rupture (conflict, abandonment, rejection) with no resolution language
- Identity or self-worth themes with present-focused despair
- Any input where the person seems stuck and the emotion has no natural release
false when:
- The person seems to have discharged the emotion (vent complete)
- Low intensity (≤ 4) regardless of theme
- Future-focused anxiety (worry about what hasn't happened yet — they need grounding, not follow-up)
- Positive check-ins
- General stress without acute personal distress

**followUpReason**: One short sentence explaining why requiresFollowUp is true.
null when requiresFollowUp is false. Internal only — never shown to user.
```

### Layer 2: Hard rules (zero AI cost)

Certain session states always require a follow-up regardless of the AI flag:

```
requiresFollowUp = true when ANY of:
  ┌─ escalationTriggered = true
  ├─ confirmationState = "gave_up"
  └─ classification.requiresFollowUp = true  (AI flag)
```

The hard rules are evaluated in `process.ts` after the classifier runs. They
override a `false` AI flag but never override a `true` one.

---

## Schema Changes

### `sessions` table — two new fields

```typescript
// Was a follow-up workflow started for this session?
requiresFollowUp: v.optional(v.boolean()),

// Workflow ID returned by workflow.start(). Stored here so:
// (1) the "userReturned" event can target the right workflow on app open
// (2) we can cancel early if the user returns before the workflow checks
followUpWorkflowId: v.optional(v.string()),
```

Add a supporting index for the profile screen query (recent follow-up sessions):

```typescript
.index("by_profile_followup", ["emotionalProfileId", "requiresFollowUp", "createdAt"])
```

### New table: `follow_up_cards`

One row per workflow execution. The Workflow writes to this table when the
check-in card is ready to surface. The app reads it on open.

```typescript
follow_up_cards: defineTable({
  emotionalProfileId: v.id("emotional_profiles"),

  // The session that triggered this follow-up.
  sessionId: v.id("sessions"),

  // The Workflow that owns this card's lifecycle.
  workflowId: v.string(),

  // What the card should say. Generated at Workflow start from
  // the session's mirror text and classifier data — so the check-in
  // references the actual content, not a generic message.
  // Example: "A few days ago you were carrying something heavy about
  // your mother. How's that landing now?"
  cardText: v.string(),

  // "pending"  — workflow active, card not yet due
  // "ready"    — user has returned, show the card on next open
  // "shown"    — card was rendered in-app, awaiting user response
  // "resolved" — user tapped a response or dismissed
  // "expired"  — workflow timed out with no return
  status: v.union(
    v.literal("pending"),
    v.literal("ready"),
    v.literal("shown"),
    v.literal("resolved"),
    v.literal("expired"),
  ),

  // User's response to the check-in card.
  // null until status = "resolved".
  userResponse: v.optional(
    v.union(
      v.literal("lighter"),    // "Feeling lighter now"
      v.literal("still_here"), // "Still sitting with it"
      v.literal("heavier"),    // "Got heavier actually"
      v.literal("processed"),  // "I worked through it"
      v.literal("vent"),       // "Let it out" → opened a fresh reflect session (design review, Issue 2b)
      v.literal("dismissed"),  // Tapped away without responding
    ),
  ),

  createdAt: v.number(),
  shownAt: v.optional(v.number()),
  resolvedAt: v.optional(v.number()),
})
  // App open query: "is there a ready card for this user?"
  .index("by_profile_status", ["emotionalProfileId", "status", "createdAt"])

  // Profile screen: follow-up history
  .index("by_profile_created", ["emotionalProfileId", "createdAt"])

  // Workflow cancellation lookup
  .index("by_workflow", ["workflowId"])
```

### `notification_log` — add `follow_up` type

```diff
type: v.union(
  v.literal("gentle_return"),
  v.literal("pattern_nudge"),
  v.literal("milestone"),
  v.literal("affirmation"),
+ v.literal("follow_up"),   // follow-up nudge for a specific session
),
```

> The **same `follow_up` literal must be added to the `type` union in
> `convex/notifications.ts`'s `schedule` mutation** (Decisions Log #4) — it
> carries its own typed union separate from the schema.
>
> **Separate rate-limit bucket (Decisions Log: nudge budget).** Today
> `notifications.schedule` rate-limits with a single `"notification"` bucket
> (1 / 24h / profile) shared across all types. Add a `followUpNudge` config in
> `lib/rateLimits.ts` and branch the bucket key by `type` so follow-up nudges
> have their own budget. The nudge step must also replicate the gating in
> `notificationTriggers.ts` (check `notifications.enabled`, the relevant toggle,
> and the quiet window) before calling `schedule` — `schedule` itself does not
> gate on preferences.

---

## `process.ts` Flow Changes

After the classifier runs and `isEscalation` is evaluated, derive the
**preliminary** flag (the `gave_up` rule is added later, at completion — see
Decisions Log correction #1):

```typescript
// After evaluateSafeguard():
const requiresFollowUp =
  isEscalation ||
  classification.requiresFollowUp === true;
```

Pass it to `deliverMirror`:

```typescript
await ctx.runMutation(internal.sessions.deliverMirror, {
  sessionId: args.sessionId,
  mirrorText,
  mirrorModelVersion: ARTICULATOR_VERSION,
  toneUsed: mirrorTone,
  ...(isEscalation ? { escalationTriggered: true, escalationResources: safeguard.resourcesPresented } : {}),
  ...(requiresFollowUp ? { requiresFollowUp: true } : {}),
});
```

`deliverMirror` writes this preliminary `requiresFollowUp` to the session doc.

**Workflow start point:** When `sessions.completePath` or `sessions.completeSession`
transitions a session to `"completed"`, compute the **final** flag:

```typescript
const finalRequiresFollowUp =
  session.requiresFollowUp === true ||          // AI + escalation flag from deliverMirror
  session.confirmationState === "gave_up" ||    // only known now, after the clarify loop
  session.escalationTriggered === true;
```

If `finalRequiresFollowUp` is true AND no follow-up already exists for this
profile (idempotency + one-active-per-profile, Decisions Log #2/#3), then
`ctx.scheduler.runAfter(0, internal.followUps.startFollowUpWorkflow, { sessionId })`.
The Workflow component is called from inside that action.

---

## Workflow Architecture

```
convex/followUps.ts

startFollowUpWorkflow (internalAction):
  1. Read session + emotional_metadata for cardText generation
  2. Generate cardText (brief, references the actual content)
  3. Create follow_up_cards row (status: "pending")
  4. workflow.start(internal.followUps.followUpWorkflow, { sessionId, workflowId, ... })
  5. Patch session.followUpWorkflowId = workflowId

followUpWorkflow (workflow.define):

  ┌─── step.awaitEvent({ name: "userReturned", workflowId }) ───┐
  │    OR step.sleep(1 * DAY)                                    │
  └──────────────────────────────────────────────────────────────┘
           │                              │
       returned early              not returned in 1 day
           │                              │
    mark card "ready"           push nudge #1 (follow_up type)
    (user sees it on next       step.awaitEvent({ name: "userReturned", workflowId })
     app open)                  OR step.sleep(3 * DAY)
                                         │                    │
                                     returned           not returned
                                         │                    │
                                  mark card "ready"   push nudge #2
                                                      step.sleep(14 * DAY)
                                                      → mark card "expired"
                                                      → done
```

**`userReturned` event emission (Decisions Log: return signal).** App open is a
*query* today (`users.getFullContext`), and queries can't send events. So we add
a dedicated **`followUps.markReturn` mutation**, called from the root layout /
auth hook on app open + foreground (light client-side debounce). It does **not**
require the user to start a new session — opening the app the next day is enough
to surface the card.

The guard lives **inside the mutation** (robust regardless of whether the
component buffers events for a not-yet-awaiting workflow): only emit
`userReturned` if enough time has passed since the triggering session completed.
This stops the event from resolving in the same sitting (the workflow starts the
instant the session completes, while the user is still in the app).

```typescript
// followUps.markReturn (mutation, called on app open/foreground):
const MIN_RETURN_GAP_MS = 8 * 60 * 60 * 1000; // ~8h floor; tune to "next day"

const activeFollowUp = await ctx.runQuery(internal.followUps.getActiveWorkflow, {
  emotionalProfileId,
});
if (
  activeFollowUp?.followUpWorkflowId &&
  Date.now() - activeFollowUp.completedAt >= MIN_RETURN_GAP_MS
) {
  await workflow.sendEvent(ctx, {
    workflowId: activeFollowUp.followUpWorkflowId,
    name: "userReturned",
  });
}
```

With one-active-follow-up-per-profile (Decisions Log #3), `getActiveWorkflow`
returns a single unambiguous target.

**Card text generation (Decisions Log: card text).** The `startFollowUpWorkflow`
action reads the session's `mirrorText` and `followUpReason` (from classifier),
and calls **Haiku** via a new `followUpCardWriter` prompt to produce a check-in
sentence. Reuses the existing `ANTHROPIC_API_KEY`. Not a new Anthropic call in
the critical path — it runs after the session completes, async.

Example output: *"A couple of days ago you were carrying something about your
mother that felt unfinished. How's that sitting now?"*

Never generic. Always rooted in what the person actually processed.

---

## UI Surface

> **Design review (locked).** The surface below is grounded in existing
> components, not drawn fresh. The original ASCII radio-grid sketch was removed —
> it used a 2×2 `○` radio pattern and a `[Dismiss quietly]` button that appear
> nowhere in this app. See "What Already Exists (design)" for the reused pieces.

### 1. Check-in card (detached BottomSheet, on app reopen)

**Surface.** A **detached `BottomSheet`** built to the same shape as
`ReturnWelcomeSheet` (`src/features/reflect/components/return-welcome-sheet.tsx`):
`BottomSheetBlurOverlay` backdrop, `detached` content `rounded-[32px] bg-overlay`,
a Flux mascot pose, a `font-serif` title carrying the `cardText`, and `EaseView`
entry. Surfaces when `follow_up_cards.status === "ready"` for the current profile.

**Reopen precedence (Issue 1).** The follow-up sheet and `ReturnWelcomeSheet` both
fire on reopen. When a `ready` follow-up card exists it **wins**: show the
follow-up sheet and suppress the return-welcome for that reopen — never stack two
sheets. Resolution: the reopen hook checks `hasPendingFollowUp` (added to
`getFullContext`, T6) before deciding which sheet to mount.

**Responses = `FeedbackSheet.Chips`, not a radio grid.** Stacked full-width
`PressableFeedback` rows (`rounded-2xl border`, `accessibilityRole="radio"` +
`accessibilityState={{ selected }}`, `py-4` ≈ 48px target) — the existing
session-end mood pattern. Base chip set:

- `lighter` — "Feeling lighter"
- `still_here` — "Still sitting with it"
- `heavier` — "Got heavier"
- `processed` — "I worked through it"
- `vent` — **"Let it out"** (Issue 2b) → resolves the card (`userResponse:
  "vent"`) and navigates to a **fresh** reflect session (no pre-seed; pre-seeding
  prior context stays deferred). The doorway back into processing; also resolves
  the "got heavier" emotional dead-end.

**Tier-aware card (Issue 2).** Acute (`safeguard.level === "crisis"`) renders a
**presence-first variant**: softer Flux pose + presence-toned `cardText`, the chip
set foregrounds `still_here` / `lighter` and **omits `processed`** (reads glib
45 min after a crisis), keeps `vent`, and shows a quiet **"resources are still
here"** link back to the `safeguard.ts` resources. Elevated/Standard render the
full chip set; the resources link shows only when the card is escalation-derived.

**Dismiss.** Backdrop tap = dismissed (`userResponse: "dismissed"`), matching
ReturnWelcomeSheet's "no wrong way to close." No guilt copy.

Tapping any chip sets `status = "resolved"` + `userResponse`, plays a one-line
`font-serif` acknowledgment ("Thanks for checking back in.", ~600ms) via
`EaseView`, then closes. The response is longitudinal signal — did the session
help, or get heavier?

**Interaction states:**

| State | Trigger | User sees |
|-------|---------|-----------|
| (no loading) | `cardText` is written at workflow start (or `FALLBACK_FOLLOWUP_CARD`), never at render | sheet always opens with text, no spinner |
| ready | `status="ready"` on reopen, follow-up wins | detached sheet eases in |
| shown | sheet mounted | `status` → `"shown"` (idempotent `status==="ready"` patch) |
| resolved | chip tapped / backdrop dismiss | acknowledgment line → `EaseView` fade → close |
| expired | workflow timed out, never returned | **nothing in-app**; profile only, muted, no guilt |
| error | Haiku outage at card write | fallback card text; sheet still fully works |

### 2. Profile screen — Follow-Ups section

Below the session timeline. **Build from the profile card vocabulary**
(`week-intensity-card` / `timeline-entry-card`: `rounded-2xl bg-surface border
border-overlay/20` rows), not ASCII bullets. Each row = one follow-up + a status
chip:

- **resolved** — the user's response ("Feeling lighter"), accent chip
- **expired** — date, muted `text-foreground/40`, no guilt, no shouting icon
- **superseded** — "unresolved · no check-in coming"; tappable; only an explicit
  dismiss closes it (weight-aware supersede policy)
- **pending / ready** — "check-in coming", muted

Only sessions with `requiresFollowUp = true` appear. Section header `font-serif`,
matching the timeline section above it.

---

## Not in Scope (This Sprint)

- AI-personalized card text drawing from RAG history — requires `@convex-dev/rag`
- Tiering follow-up cadence based on user's emotional pattern over time
- Premium gating (follow-ups are free tier)
- In-app notification inbox for follow-up nudges
- Linking the follow-up card response back into a new session (tap → open reflect with pre-seeded context)

The last item is worth noting: a user tapping "Got heavier actually" could be
offered a one-tap "want to process that now?" moment. Natural next-session entry
point. Deferred but obvious.


##workflow component
Help me install the Workflow component.

Package: @convex-dev/workflow
Install: npm install @convex-dev/workflow

Documentation:
- https://www.convex.dev/components/workflow/workflow.md
- https://www.convex.dev/components/workflow/llms.txt

Please:
1. Retrieve the install command and documentation
2. Generate an exact setup checklist for this component
3. List any required environment variables
4. Provide verification steps

---

## Implementation Tasks
Synthesized from this review's findings. Each task derives from a specific finding above. Run with Claude Code or Codex; checkbox as you ship.

- [ ] **T14 (P1, human: ~30min / CC: ~10min)** — infra — Install `@convex-dev/workflow` (bun), register in `convex.config.ts`, verify codegen (PREREQ, do first)
  - Files: `package.json`, `convex/convex.config.ts`
  - Verify: `bunx convex dev` codegens the workflow component cleanly
- [ ] **T15 (P2, human: ~1h / CC: ~15min)** — schema — `follow_up_cards` table + indexes; add `follow_up` to `notification_log` type AND `notifications.schedule`'s union; `followUpNudge` rate-limit bucket
  - Files: `convex/schema.ts`, `convex/notifications.ts`, `convex/lib/rateLimits.ts`
- [ ] **T1 (P1, human: ~1h / CC: ~15min)** — backend — Gate `abandon` + `checkAbandoned` on `escalationTriggered` (Arch#1)
  - Files: `convex/sessions.ts`, `convex/jobs/notificationTriggers.ts`, `convex/crons.ts`
  - Verify: regression test T13
- [ ] **T2 (P1, human: ~45min / CC: ~10min)** — schema — Persist `requiresFollowUp` on `sessions` + `followUpReason` on `emotional_metadata` (Arch#2)
  - Files: `convex/schema.ts`, `convex/ai/process.ts`, `convex/sessions.ts`
- [ ] **T3 (P1, human: ~30min / CC: ~10min)** — backend — `markReturn` uses `card.createdAt`; `getActiveWorkflow` matches `status="pending"` only (Arch#3/#4)
  - Files: `convex/followUps.ts`
- [ ] **T4 (P1, human: ~30min / CC: ~10min)** — backend — Card-writer try/catch → `FALLBACK_FOLLOWUP_CARD`; workflow always starts (CodeQ#7)
  - Files: `convex/followUps.ts`, `convex/ai/prompts/followUpCardWriter.ts`
- [ ] **T5 (P1, human: ~1h / CC: ~15min)** — privacy — Purge `follow_up_cards` + cancel active workflow in `dataWipe` + `accountDeletion` (CRITICAL)
  - Files: `convex/jobs/dataWipe.ts`, `convex/jobs/accountDeletion.ts`, `convex/followUps.ts`
- [ ] **T6 (P1, human: ~1h / CC: ~15min)** — backend — `hasPendingFollowUp` on `getFullContext`; client calls `markReturn` only when true; pin to reflect-screen load (Perf#9 + OV hook)
  - Files: `convex/users.ts`, `convex/followUps.ts`, `src/app/_layout.tsx` (or reflect screen)
- [ ] **T7 (P1, human: ~2h / CC: ~25min)** — backend — Supersede policy + `superseded` status; old card stays visible/tappable; **weight-aware (supersede only if new tier ≥ active tier)** (OV#C + tiering)
  - Files: `convex/schema.ts`, `convex/followUps.ts`, profile Follow-Ups section
- [ ] **T16 (P1, human: ~1.5h / CC: ~20min)** — backend — `followUpCadence(session): Cadence` pure fn + tier config (Acute/Elevated/Standard); pass durations as `workflow.start` args; `bun:test` the tier mapping (weight-tiered cadence)
  - Files: `convex/followUps.ts`, `convex/lib`
  - Verify: unit test each tier boundary (crisis→Acute, elevated/intensity≥7/gave_up→Elevated, else→Standard)
- [ ] **T17 (P2, human: ~30min / CC: ~10min)** — backend — Acute-tier push uses recency-anchored, wound-free body; cardText shown in-app only for Acute (acute content)
  - Files: `convex/followUps.ts`, `convex/ai/prompts/followUpCardWriter.ts`
- [ ] **T18 (P2, human: ~15min / CC: ~5min)** — ai — Classifier prompt: default `requiresFollowUp` false, reserve for genuinely unresolved high-stakes moments (selectivity)
  - Files: `convex/ai/prompts/classifier.ts`
- [ ] **T8 (P1, human: ~1h / CC: ~15min)** — backend — Parameterize workflow sleep durations as `workflow.start` args; additive-only versioning discipline (OV#D)
  - Files: `convex/followUps.ts`
- [ ] **T9 (P1, human: ~45min / CC: ~10min)** — backend — Idempotent card transitions (conditional `status="pending"` guard) for multi-device + timer/event ties (OV)
  - Files: `convex/followUps.ts`
- [ ] **T10 (P2, human: ~30min / CC: ~10min)** — ai — `gave_up` sessions use mirror-free card copy (OV#B)
  - Files: `convex/ai/prompts/followUpCardWriter.ts`
- [ ] **T11 (P1, human: ~2h / CC: ~20min)** — test — `requiresFollowUp.eval.ts` (~15-20 labeled inputs, `bun:test`, live Haiku) (Test#8)
  - Files: `convex/ai/prompts/__evals__/requiresFollowUp.eval.ts`
- [ ] **T12 (P1, human: ~1h / CC: ~15min)** — test — Extract `computeRequiresFollowUp` + `shouldEmitReturn` pure helpers; `bun:test` both
  - Files: `convex/followUps.ts`, `convex/lib`
- [ ] **T13 (P1, human: ~1h / CC: ~15min)** — test — REGRESSION: abandon w/o escalation → NO follow-up; w/ escalation → starts (IRON rule)
  - Files: `convex/followUps.ts` (+ test)

### Design tasks (from `/plan-design-review`)

- [ ] **D1 (P1, human: ~3h / CC: ~30min)** — ui — `FollowUpCheckInSheet`: detached `BottomSheet` on the `ReturnWelcomeSheet` shape (blur backdrop, Flux pose, `font-serif` cardText, `EaseView` entry) + `FeedbackSheet.Chips` responses. **Reopen precedence:** when a `ready` card exists it suppresses `ReturnWelcomeSheet` that reopen (Issue 1).
  - Surfaced by: Pass 1 (Info Architecture, 3/10) — surface ambiguity + ReturnWelcomeSheet collision
  - Files: `src/features/reflect/components/follow-up-check-in-sheet.tsx` (new), `src/features/reflect/follow-up-copy.ts` (new, mirror return-welcome-copy), the app-open/reflect reopen hook
  - Verify: with a `ready` card on reopen, follow-up sheet shows and return-welcome does not; never both
- [ ] **D2 (P1, human: ~1.5h / CC: ~20min)** — ui — Tier-aware card: Acute (`crisis`) presence-first variant (softer Flux pose + presence copy, omit `processed` chip, keep "resources are still here" link → `safeguard.ts`); Elevated/Standard full chip set (Issue 2)
  - Surfaced by: Pass 3 (Emotional Arc, 5/10) — identical card 45 min after a crisis reads glib
  - Files: `follow-up-check-in-sheet.tsx`, `convex/ai/prompts/followUpCardWriter.ts`
- [ ] **D3 (P1, human: ~1h / CC: ~15min)** — ui — "Let it out" vent chip → resolve card (`userResponse: "vent"`) → navigate to a **fresh** reflect session (no pre-seed). Schema `userResponse` union gains `"vent"` (Issue 2b)
  - Surfaced by: Pass 3 / Pass 7 — "got heavier" had no path forward
  - Files: `convex/schema.ts`, `convex/followUps.ts` (resolve mutation), `follow-up-check-in-sheet.tsx`, reflect route
- [ ] **D4 (P2, human: ~30min / CC: ~10min)** — ui — Resolution acknowledgment micro-state ("Thanks for checking back in.", `font-serif`) → `EaseView` fade → unmount via `onTransitionEnd` (never `setTimeout`)
  - Surfaced by: Pass 2 (States, 4/10) — no spec between tap and dismissal
  - Files: `follow-up-check-in-sheet.tsx`
- [ ] **D5 (P2, human: ~1.5h / CC: ~20min)** — ui — Profile Follow-Ups section built from profile card vocabulary (`rounded-2xl bg-surface` rows + status chips), incl. `superseded` = "unresolved · no check-in coming" (tappable). Replaces ASCII bullets
  - Surfaced by: Pass 7 — profile list not aligned to the card system
  - Files: `src/features/profile/components/` (new follow-ups section), profile screen
- [ ] **D6 (P2, human: ~45min / CC: ~10min)** — a11y — Chips `accessibilityRole="radio"` + `accessibilityState`; sheet `accessibilityViewIsModal`; Flux `accessibilityLabel`; resources link ≥44px target; `BottomSheetScrollView` so the 5-chip Acute card scrolls on small screens
  - Surfaced by: Pass 6 (Responsive & A11y, 4/10)
  - Files: `follow-up-check-in-sheet.tsx`

## What Already Exists (reuse, don't rebuild)
- `convex/jobs/notificationTriggers.ts` — cron-swept batch nudge pattern (`checkGentleReturn`/`checkPatternNudge`) with `enabled`+toggle+quiet-window gating. Reused for the nudge-delivery shape; follow-up uses `enabled`-only gating.
- `convex/notifications.ts` `schedule` + `notification_log` + `pushNotifications` component — reused for follow-up push delivery (just add the `follow_up` type + bucket).
- `convex/lib/rateLimits.ts` — reused; add a `followUpNudge` bucket.
- `FALLBACK_MIRROR` pattern (`process.ts`) — reused conceptually for `FALLBACK_FOLLOWUP_CARD`.
- `bun:test` pure-function convention (`convex/exercises/match.test.ts`) — reused for the new pure helpers + eval.
- The privacy-cleanup batch-delete pattern in `dataWipe.ts`/`accountDeletion.ts` — extended to `follow_up_cards` + workflow cancel.

### What Already Exists (design — reuse, don't redraw)
- `ReturnWelcomeSheet` + `return-welcome-copy.ts` (`src/features/reflect/`) — detached blurred sheet with Flux pose, `font-serif` title, tiered no-guilt copy. **The exact template** for the check-in sheet (D1); also the surface the follow-up must out-prioritize on reopen.
- `FeedbackSheet.*` (`src/features/session-end/components/feedback-sheet.tsx`) — compound Frame/Header/Chips/Input/Submit. `Chips` = stacked `PressableFeedback` with `accessibilityRole="radio"`; reuse verbatim for the response set (D1/D6).
- `BottomSheetBlurOverlay` (`src/components/`) — the blur backdrop convention (memory: blur should be *felt*).
- Session-end mood prompts (`heavier-feedback-prompt.tsx`, etc.) — the "how did that land?" pattern the check-in card mirrors.
- `gave-up-feedback-card.tsx` — `EaseView` fade with `onTransitionEnd` → `setMounted(false)` (no `setTimeout`); the resolution micro-state model for D4.
- Profile cards (`week-intensity-card.tsx`, `timeline-entry-card.tsx`) — `rounded-2xl bg-surface` row vocabulary for the Follow-Ups section (D5).
- Flux mascot poses (`assets/images/flux/`) — no orb/ember; use a pose.

## NOT in Scope (this sprint)
- Card-writer rubric eval — deferred to TODOS (fast-follow after first feedback round).
- Shared notification-gating helper refactor for the existing two triggers — deferred to TODOS (debt paydown, not blocking).
- Crisis-excluded / wound-free push — **considered and explicitly rejected** by the user for the early-feedback phase (accepted risk).
- Per-type `followUp` notification toggle — dropped by design (`enabled` is the only off-switch).
- Quiet-window for follow-up pushes — dropped by design for early-stage aggressiveness.
- RAG-personalized card text, cadence tiering, premium gating, in-app nudge inbox, tap-to-pre-seed-session — already deferred in the doc.

### NOT in scope (design — considered, deferred)
- **Pre-seeding the vent session** with the prior card's context — the "Let it out" chip opens a *blank* reflect session this sprint; threading prior context in is the deferred tap-to-pre-seed item.
- **Tier-specific Flux animations / distinct illustrations per tier** — Acute uses a softer existing pose, not a new asset. Bespoke per-tier art deferred.
- **Skeleton/loading state for the card** — none needed: `cardText` is always written (or fallback) before `status` is ever `ready`, so the sheet never renders mid-generation.
- **Profile Follow-Ups empty state illustration** — when a user has no follow-ups the section is simply absent (no warmth-card needed yet); revisit if it becomes a permanent profile fixture.

## Failure Modes (per new codepath)
| Codepath | Realistic failure | Test? | Error handling? | User sees |
|----------|-------------------|-------|-----------------|-----------|
| `startFollowUpWorkflow` Haiku call | Anthropic outage/timeout | T11 adjacent | try/catch → fallback (T4) | Fallback card, no crash |
| `markReturn` gap guard | wrong/missing timestamp → `NaN` | T12 (`shouldEmitReturn`) | guard on `card.createdAt` | (fixed) card surfaces |
| abandon gating | escalation-abandon dropped | T13 (CRITICAL) | gate added (T1) | follow-up starts |
| dataWipe/accountDeletion | orphan card + live workflow nudges deleted user | needs test | cancel+purge (T5) | **was silent privacy leak** |
| multi-device foreground | double flip-to-ready + double nudge | needs test | conditional patch (T9) | one card, one nudge |
| 14-day workflow + mid-flight deploy | nondeterministic replay | — | args-not-constants (T8) | workflow completes correctly |

**Critical gaps (no test AND no handling AND silent):** none remain after T4/T5/T9 land. Until then, the dataWipe/accountDeletion orphan (T5) is the highest-severity silent gap.

## Parallelization
- **Lane A (sequential, shared `convex/` core):** T14 → T15 → T2 → T1 → T3 → T7 → T8 → T9 (schema + workflow core, one module family).
- **Lane B (after T15, independent):** T5 privacy cleanup (`jobs/`), T6 return-detection (`users.ts` + client).
- **Lane C (after T4 prompt exists):** T10 card copy, T11 eval.
- **Lane D (after core lands):** T12/T13 tests.
- Execution: Lane A is the spine and mostly sequential (everything touches `followUps.ts`/`schema.ts`). B can run parallel once T15 lands. C/D follow. **Conflict flag:** T7 and T8/T9 all touch `convex/followUps.ts` — keep them in one lane, do not parallelize.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES FOLDED | 13 issues + 3 post-review amendments (weight tiers / acute content / weight-aware supersede), all folded |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | ISSUES FOLDED | score 4/10 → 8/10, 4 decisions folded (card surface + reopen precedence, tier-aware card, vent chip, profile section); 6 design tasks D1–D6 |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CROSS-MODEL:** Codex unavailable on this account (`gpt-5.1-codex-max` rejected for ChatGPT-account Codex) → outside voice ran as a Claude subagent. It raised 9 new points; 4 substantive ones went to the user (push safety, `gave_up` noise, supersede starvation, workflow versioning). One true tension — Workflow component vs cron — was re-opened with the new 14-day-versioning argument; the user reaffirmed the Workflow component and chose to design for stability (sleep durations as args).
- **DESIGN:** Started 4/10 (strong copy intent, placeholder UI that ignored the app's sheet/chip/Flux system + an unaddressed `ReturnWelcomeSheet` reopen collision). Now 8/10: check-in card respecified as a detached `BottomSheet` (D1) with `FeedbackSheet.Chips`, follow-up wins reopen precedence, tier-aware Acute presence card with resources link (D2), a "Let it out" vent doorway (D3, schema `userResponse += vent`), resolution micro-state (D4), profile section on the card vocabulary (D5), a11y pass (D6). One design TODO logged (pre-seed the vent session). Remaining 2 points are post-build visual QA via `/design-review`.
- **VERDICT:** ENG + DESIGN reviewed — all 13 eng findings + 4 design decisions folded into the Implementation Tasks above. No unresolved decisions. Ready to implement (run `/ship` when built). One explicitly-accepted product risk recorded: wound-naming push for Elevated/Standard sessions.

NO UNRESOLVED DECISIONS