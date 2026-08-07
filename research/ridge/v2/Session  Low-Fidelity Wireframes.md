Session Low-Fidelity Wireframes
===============================

**Version:** 0.1**Status:** UX Design**Purpose:** Define the structure before UI styling.

Wireframe Philosophy
====================

The wireframes are **not** meant to look beautiful.

Their job is to answer:

*   Where is everything?
    
*   What appears first?
    
*   What disappears?
    
*   What changes?
    
*   What stays constant?
    

If someone can understand the experience from black-and-white boxes, the design is strong.

Overall Flow
============

```
┌───────────────────────┐
│ Expression            │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Mirror                │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Confirmation          │
└──────────┬────────────┘
           │
           ▼
 Invisible Detection
 Invisible Connection
 Invisible Routing
           │
           ▼
┌───────────────────────┐
│ Dynamic Path          │
└──────────┬────────────┘
           │
           ▼
        Session Ends
```

Notice:

The user only sees **four moments**.

Everything else happens internally.

Screen 1 — Expression
=====================

```
────────────────────────────
👤                       ⚙️
Still awake.
What's carrying
over?
────────────────────────────
[ Text Input ]
────────────────────────────
[ Emotion Chips ]
wide awake
too much
can't stop thinking
...
────────────────────────────             Let it out
────────────────────────────
```

No redesign.

This screen already feels like Xolace.

Screen 2 — Mirror
=================

```
────────────────────────────
too much
THE MIRROR
Everything pressing in again...
The warmth that was just there...
...
────────────────────────────
That's it
Not quite
Say more
────────────────────────────
```

Again...

No redesign.

Only typography improvements later.

Internal Transition
===================

User sees...

```
That's it
```

Internally...

```
Mirror Confidence
↓
Need Detection
↓
Connection Type
↓
Best Path
↓
Generate Path
```

No loading spinner.

Maybe a **600–900ms fade**.

Almost invisible.

Screen 3 — Dynamic Path
=======================

Example A

```
────────────────────────────
YOUR PATH
Sit With This
The feeling hasn't disappeared.
It just doesn't need solving immediately.
Spend one quiet minute noticing your breathing.
────────────────────────────
Start Exercise
────────────────────────────
Skip
────────────────────────────
```

Example B

```
────────────────────────────
YOUR PATH
Take This With You
You've been trying to fight this feeling.
This week...
Notice when it first appears.
Nothing else.
────────────────────────────
Done
────────────────────────────
```

Example C

```
────────────────────────────
YOUR PATH
Something Keeps Returning
Across several reflections...
This feeling appears after difficult conversations.
That isn't an answer.
But it might be somewhere to begin.
────────────────────────────
View Insights
────────────────────────────
```

Example D

```
────────────────────────────
YOUR PATH
You're Not Alone
Someone else wrote this.
"I thought nobody would understand."
Maybe read what helped them.
────────────────────────────
Read Reflections
────────────────────────────
```

Notice something.

The layout **never changes**.

Only the content changes.

Screen Anatomy
==============

```
Small Label
↓
Large Title
↓
Reflection
↓
Action
↓
Exit
```

Nothing else.

Component Hierarchy
===================

Priority

```
Reflection
```

↓

```
Path
```

↓

```
Primary Action
```

↓

```
Secondary Action
```

↓

```
Navigation
```

Dynamic Areas
=============

Only these areas change.

```
Title
Body
CTA
Optional Insight
```

Everything else stays fixed.

That consistency reduces cognitive load.

Motion Specification
====================

Expression

↓

Fade

↓

Mirror

↓

Fade

↓

Path

↓

Fade

↓

Done

Never slide large panels.

Never animate lots of objects.

Everything should feel like breathing.

White Space
===========

One thing I noticed from the current app...

The spacing is already excellent.

I would actually increase it slightly.

Especially on the Path screen.

The Path should feel almost like reading a letter.

CTA Behaviour
=============

One CTA.

Always.

Not three primary buttons.

Example

```
Start Exercise
```

or

```
View Insights
```

or

```
Done
```

One decision.

One action.

Design Rule
===========

This might become one of Xolace's design principles:

> **Every screen should reduce emotional effort, never increase it.**