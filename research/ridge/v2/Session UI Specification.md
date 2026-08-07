\# Session UI Specification

Version: 0.1

Status: Draft

Product: Xolace

Feature: Session V2

Owner: Product Engineering

\---

\# Objective

Design a session experience that feels calm, personal and intelligent.

The user should never feel like they are navigating multiple features.

Instead, the entire experience should feel like one continuous conversation.

\---

\# Design Philosophy

The UI should not communicate complexity.

The AI can be complex internally.

The interface must remain simple.

Every screen should answer exactly one question.

\---

\# Screen Hierarchy

Screen 1

Expression

↓

Screen 2

Mirror

↓

Screen 3

Confirmation

↓

Screen 4

Path

↓

Close

Nothing else.

\---

\# Screen 1 — Expression

Purpose

Allow users to express what they are carrying.

Current UI

Keep almost everything.

Elements

• Greeting

• Text input

• Voice input

• Suggested emotion chips

• "Let it out" button

Changes

None.

The current design already fits the product philosophy.

\---

\# Screen 2 — Mirror

Purpose

Help the user feel understood.

Layout

Top

Selected emotion chip

↓

Mirror Label

↓

Reflection

↓

Actions

That's it

Not quite

Say more

Rules

Mirror must stay distraction free.

No graphs.

No cards.

No recommendations.

No insights.

Only reflection.

\---

\# Screen 3 — Confirmation

Purpose

Determine whether the Mirror understood the user.

Current Buttons

That's it

Not quite

Say more

Behaviour

That's it

↓

Continue

Not quite

↓

Allow correction

Say more

↓

Continue conversation

No UI changes required.

\---

\# Invisible Transition

The user never sees this.

Internally the AI performs

Intent Detection

↓

Connection Detection

↓

Path Selection

↓

Path Generation

No loading should feel long.

Keep transition subtle.

\---

\# Screen 4 — Path

Purpose

Help the user leave with something meaningful.

This replaces the feeling of

"Okay...

Now what?"

\---

\# Layout

Small label

YOUR PATH

↓

Title

One sentence

↓

Main content

↓

Optional action

↓

Done

\---

\# Path Types

\## Grounding

Example

Sit With This

Body

A short explanation.

Action

Start breathing exercise.

\---

\## Human Connection

Example

You're Not Alone

Body

Brief explanation.

Action

Read anonymous reflections.

\---

\## Perspective

Example

Take This With You

Body

A thoughtful reflection.

No action required.

\---

\## Pattern Awareness

Example

Something keeps returning.

Body

Across your recent reflections...

Action

Open Insights.

\---

\## Hope

Example

Carry this today.

Body

A gentle observation.

Action

Done.

\---

\# Interaction Rules

Every Path contains

One idea.

Never multiple.

Never overwhelm.

\---

\# CTA Rules

One primary action.

One secondary action maximum.

Examples

Start

Read

Continue

Done

Avoid

Five buttons.

Choice overload.

\---

\# Visual Hierarchy

Priority

1

Reflection

↓

2

Path

↓

3

Action

↓

4

Supporting information

Nothing should compete with the reflection.

\---

\# Motion

Transitions should be slow.

Fade

Slide

Blur

Opacity

Avoid

Bounce

Spring

Confetti

Fast animations.

\---

\# Colours

Continue existing Xolace palette.

Dark first.

Soft accent colours.

Warm highlights.

No bright success greens.

No warning reds unless necessary.

\---

\# Typography

Large headings.

Comfortable reading width.

Generous spacing.

Readable paragraphs.

Mirror text should remain the visual focus.

\---

\# Empty States

If no meaningful Path exists

Default

Take This With You

Example

"You don't have to solve everything today.

Sometimes noticing is enough."

\---

\# Error States

If AI confidence is low

Mirror asks

"Would you like to tell me a little more?"

Rather than generating weak Paths.

\---

\# Personalisation

The layout never changes.

Only the content changes.

The user should recognise the interface every session.

Only the Path changes.

\---

\# Dynamic Elements

Dynamic

Mirror

↓

Path

↓

Reflection

↓

Emotion

Static

Layout

Typography

Navigation

Spacing

Buttons

\---

\# Relationship with Insights

Sessions answer

"What am I carrying?"

Insights answer

"What have I been carrying?"

Path can occasionally bridge into Insights.

Example

"Across your recent reflections, this feeling has appeared several times."

↓

View Insights

This should happen only when confidence is high.

\---

\# Success Criteria

When the session ends

The user should feel

"I'm leaving with something."

Not

"I've completed another screen."

\---

\# North Star

The interface should disappear.

The user should only remember

The reflection they received

and

The one thing they carried into real life.