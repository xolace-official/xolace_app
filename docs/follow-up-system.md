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

---

## `process.ts` Flow Changes

After the classifier runs and `isEscalation` is evaluated, derive the flag:

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

`deliverMirror` writes `requiresFollowUp` to the session doc.

**Workflow start point:** When `sessions.completePath` or `sessions.exitSession`
transitions a session to `"completed"`, check if `requiresFollowUp = true` and if
so, `ctx.scheduler.runAfter(0, internal.followUps.startWorkflow, { sessionId })`.
The Workflow component is called from the action that `startWorkflow` invokes.

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

**`userReturned` event emission:** fired from the app's root layout or auth
hook on every authenticated app open. Targeting is by `workflowId` stored on
the session — which means only active workflows for this user are woken.

```typescript
// On app open (after auth is confirmed):
const activeFollowUp = await ctx.runQuery(internal.followUps.getActiveWorkflow, {
  emotionalProfileId,
});
if (activeFollowUp?.followUpWorkflowId) {
  await workflow.sendEvent(ctx, {
    workflowId: activeFollowUp.followUpWorkflowId,
    name: "userReturned",
  });
}
```

**Card text generation:** The `startFollowUpWorkflow` action reads the session's
`mirrorText` and `followUpReason` (from classifier), and uses a short prompt to
produce a check-in sentence. Not a new Anthropic call in the critical path — it
runs after the session completes, async.

Example output: *"A couple of days ago you were carrying something about your
mother that felt unfinished. How's that sitting now?"*

Never generic. Always rooted in what the person actually processed.

---

## UI Surface

### 1. Check-in card (on app open)

Appears on the reflect screen (or as a modal before the idle state) when
`follow_up_cards.status = "ready"` for the current user.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   A couple of days ago you were carrying            │
│   something heavy about your mother.                │
│   How's that sitting now?                           │
│                                                     │
│   ○ Feeling lighter        ○ Still sitting with it  │
│   ○ Got heavier actually   ○ I worked through it    │
│                                                     │
│                          [Dismiss quietly]          │
└─────────────────────────────────────────────────────┘
```

Tapping any response sets `status = "resolved"` and `userResponse`. The response
data is valuable longitudinal signal — did the session help? Did it get worse?

### 2. Profile screen — Follow-Ups section

Below the session timeline, a section showing sessions that had follow-ups and
their resolution state.

```
Follow-Ups
──────────
● 3 days ago · resolved · "Feeling lighter"
● 2 weeks ago · resolved · "Worked through it"
  Jun 8 · expired · (no response)
```

Only sessions with `requiresFollowUp = true` appear here. Status badges:
- resolved: shows the user's response
- expired: shows date with muted text, no guilt
- pending/ready: shows "check-in coming" — not yet resolved

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
