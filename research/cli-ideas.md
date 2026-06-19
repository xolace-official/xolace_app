# CLI Product Ideas

---

## `unsaid`

A command-line emotional processing tool for founders. One question, one mirror, done. The core Xolace mechanic stripped to its minimum and delivered where technical founders already live — the terminal.

---

### The Problem It Solves

Founders have moments they can't say anywhere. Not to co-founders (power dynamics), not to investors (optics), not to therapists (scheduling friction). `unsaid` is the zero-friction release valve for those moments — available at 2am, no app to open, no account required to start.

---

### V1 — The Absolute Minimum

```bash
$ unsaid

What happened?
> I just lost a key engineer and I don't know how to tell the team yet

──────────────────────────────────────────
You're not managing a personnel change —
you're holding a fear about what this signals.
Will they think the company is unstable?
Will they wonder if you couldn't keep good people?
──────────────────────────────────────────

Heard. [y to say more]

$
```

**What's in v1:**
- One question: "What happened?"
- Freeform text input
- AI mirror (1-3 sentences)
- Optional second turn ("y to say more")
- "Heard." as the close

**What's NOT in v1:**
- No account, no login
- No cloud sync
- No path selection
- No history
- No arc

**The non-negotiable:** Mirror quality is the floor, not UX. A generic mirror kills the product. The AI must read through the founder's business framing and name the emotional truth underneath. "That sounds hard" is a failure state.

---

### The AI Prompt Difference

Founders don't express emotion as emotion. They express it as operational events:

> "We missed the metric again and the board call is Friday"
> "My co-founder and I disagreed on the roadmap and neither of us said anything after"
> "Launched Tuesday. Nothing happened."

The `unsaid` system prompt must instruct the model to read business language as emotional signal and name what's underneath — not reflect the situation back. This is a different instruction layer from the core Xolace flow, using the same Anthropic pipeline.

**Rule:** Never say "that sounds hard." Name the specific fear, identity threat, or isolation inside the business language.

---

### Access Model

**Trial (no account):** 3–5 sessions. AI works. Stored locally. No history after restart. We subsidize these sessions — enough to feel what it does.

**Free (with account):** Unlimited sessions. Full history. Syncs to Xolace backend. Sessions appear in the Xolace app timeline. Account is the upgrade from trial, not a paywall.

**Paid:** The depth layers that require accumulated data:
- Arc library access + personalized matching
- Founder Signal patterns (`unsaid --patterns`)
- `brief` / `debrief` subcommands
- Arc contribution (submit your own recovery story)

**Key principle:** Account = free. Depth = paid. Sync comes with the account, not the paid tier.

---

### Growth Path

**V1.5 — Context flag**

Optional signal to sharpen the mirror. Never required.

```bash
$ unsaid --after "YC interview"
$ unsaid --before "board meeting"
$ unsaid --context "co-founder conflict"
```

**V2 — Login + cloud sync**

```bash
$ unsaid --login
```

Opens browser → Clerk OAuth → token stored locally. Sessions sync to Xolace account. CLI sessions appear in the Xolace app timeline alongside mobile sessions.

**V3 — Session history**

```bash
$ unsaid --log

Jun 12  "lost a key engineer"
Jun 10  "board meeting went sideways"
Jun 07  "co-founder disagreement about roadmap"
Jun 03  "launch silence — no one cared"
```

Timestamps and first line only. No sentiment scores, no wellness charts. A record that you showed up.

**V4 — Subcommands (`brief` and `debrief`)**

```bash
$ unsaid brief "investor meeting in 15"
$ unsaid debrief
```

`brief` clears ambient noise before something high-stakes. `debrief` releases what accumulated during it. They're paired. `debrief` can reference the brief: "you came in holding X — what actually happened?"

**V5 — Arc integration**

After the mirror, on heavy sessions only, an optional line appears:

```bash
──────────────────────────────────────────
You're not managing a personnel change —
you're holding a fear about what this signals.
──────────────────────────────────────────

Heard. [y to say more / a for arc]
```

`a` pulls a matched Founder Arc — a recovery story from someone who came through a similar moment. Not offered after every session. Only when the AI reads the weight as high enough.

**V6 — Founder Signal**

```bash
$ unsaid --patterns

Last 90 days:
  Most common thread: team trust / what others think of you
  Heaviest periods: around board meetings, post-launch silence
  12 sessions. Showed up 12 times.
```

Pattern language, not a wellness dashboard. No graphs, no scores. Two lines of terminal output from 90 days of data.

---

### Arc Integration

The Arc library lives in Convex — shared backend, shared pool of founder recovery stories.

Two access points:

1. **From inside `unsaid`** — offered after the mirror on heavy sessions (`a for arc`)
2. **`arc` as its own command** — for when you don't need to process, you need fuel. Pull a recovery story directly without going through `unsaid` first.

Same library, two doors, two different emotional states they serve.

With login, Arc access becomes personalized — matches to the specific patterns in your session history rather than just the current input.

---

### Distribution

**Brew / npm**
```bash
brew install unsaid
npm install -g unsaid
```
Zero friction for technical founders. Word of mouth travels through dotfiles and dev Twitter.

**GitHub README as the product page**
No marketing site. The README is the landing page. Founders trust tools that live on GitHub with a clean README more than wellness app landing pages.

**Accelerator integration**
YC, Antler, Founders Factory — single Slack message from a batch partner reaches exactly the right founder at exactly the right moment. Accelerators can sponsor paid access for their cohort.

---

### Relationship to Xolace

`unsaid` is not a separate product. It is a distribution surface for Xolace's Founder Mode — a lower-friction entry point for technical founders who won't download a wellness app. The CLI and the mobile app share the same Convex backend, the same Clerk auth, and the same Arc library. A founder who starts on `unsaid` is a Xolace user.

---

## `arc`

A library of short, structured founder recovery stories. Not success porn. Not inspirational quotes. Specific accounts of hard moments — told from inside them, not from after the exit.

The reader isn't looking for inspiration. They're looking for witness: someone who was where they are and came through it.

---

### The 4-Beat Structure

Every arc has exactly four beats.

1. **The moment** — what happened, specifically. Not "we almost ran out of runway." What actually happened on a specific day.
2. **What it actually felt like** — the emotional truth underneath the business framing. Not "I was stressed." What the fear was, what the identity threat was.
3. **What shifted** — not a silver lining. Something specific changed in how they saw it. A conversation, a reframe, a decision. Often small.
4. **What they carried** — one thing they took forward. Not a lesson. A specific thing they now know about themselves or the work.

---

### What it looks like

```bash
$ arc

What are you carrying right now?
> launch silence

──────────────────────────────────────────
After we launched, nothing happened.
No users. No noise. Just silence.

What I actually felt: like I'd misread everything —
the market, the timing, myself.

What shifted: a founder in my batch said "launch is
a data point, not a verdict." Not comfort. Just accuracy.

What I carried: I stopped treating silence as confirmation
of the worst thing I believed about myself.
──────────────────────────────────────────

[1 of 3]  n for another
```

No framing. No attribution. No "here's an inspiring story." Just the moment.

**On alternatives:** you get up to 3 matched arcs per query. Not infinite browsing — if none of the 3 land, that's a signal the match wasn't close enough, not a reason to scan the whole library.

---

### Two Modes

**Side 1 — Moment mode**

You know what you're in. You pass it in or answer the prompted question. Arc finds someone who came through that specific thing.

```bash
$ arc                                  # prompts "What are you carrying right now?"
$ arc --moment "launch silence"        # direct, skips the prompt
$ arc --moment "co-founder conflict"
$ arc --moment "board meeting pressure"
```

Works without an account. This is the "I need to find a witness right now" use.

**Side 2 — Pattern mode**

You don't specify a moment. Arc pulls from your session history — what keeps coming up, what you carry around board meetings, after launches, in co-founder moments.

```bash
$ arc --patterns
```

Requires account (needs history). Less acute than moment mode — more reflective. "Show me something from my recurring thread."

---

### V1 — The Absolute Minimum

- 15 hand-seeded arcs, curated before launch
- Moment mode only (`arc` or `arc --moment "..."`)
- Rough theme matching (keyword + category)
- Up to 3 alternatives per query
- Contribution prompt shown after a match — collection only, nothing goes live automatically

**The non-negotiable:** seed quality is the floor. One generic arc ("it was hard but we pushed through") destroys trust on first use. 15 specific, real arcs beat 100 polished ones.

---

### Cold Start

The library is useless without content, and bad content is worse than nothing.

**The right approach for v1:** seed manually before launch. Three options, in order of quality:

**Direct founder interviews (highest quality):** Talk to 15–20 founders — not about their company, about one specific hard moment. Extract the 4 beats. They approve it. It goes in. Slow, produces real arcs.

**Existing content extraction:** Podcasts, long-form essays, YC retrospectives. The raw material exists — it needs to be shaped into 4 beats and cleared for use. Faster, requires editorial work.

**AI-generated placeholders (dangerous):** Only viable as clearly-marked scaffolding while real arcs are collected. One synthetic arc that lands flat and you've lost the founder.

---

### Getting the First Arcs — Founder Outreach Tips

The cold start is a people problem before it's a product problem. Here's how to approach it.

---

**Who to target first**

Not the most successful founders. Not the ones who have already told their story publicly. Target founders who are 6–18 months past a specific hard moment — far enough to articulate it, close enough that it still feels real. Good hunting grounds:

- YC/accelerator alumni from recent batches (W23, S23, W24)
- Founders in your personal network who you know had a visible hard moment (a pivot, a co-founder split, a failed launch)
- Indie hacker / bootstrapper communities — they tend to be more candid than VC-backed founders
- Founders who have written honestly on Twitter/X or their own blog about a specific low point

Avoid: founders mid-exit, founders who are still in the middle of the hard thing (not enough distance), and anyone who has already turned their story into a TED talk.

---

**How to open the conversation**

Never frame it as "can you share an inspiring story." You'll get a LinkedIn post.

The right framing is small, specific, and low-stakes:

> "I'm building something for founders and I'm looking for people who'd be willing to describe one specific hard moment — not a success story, just a moment when something felt like it might not work out. 10-15 minutes. Completely anonymous if you want."

Key elements:
- "one specific moment" — not their journey, not their arc, just one moment
- "not a success story" — explicitly disarm the performance instinct
- "anonymous if you want" — removes the stakes before they've even agreed

The ask is small. A 10-minute conversation, not a podcast interview.

---

**The actual conversation**

Open with this exact question and don't deviate from it:

> "Tell me about a specific moment — not a period, a moment — when you genuinely didn't know if it was going to work out."

Then stop talking. Let them find it. It might take a beat. That's fine.

Once they land on a moment, work through the 4 beats in order. Don't label them — just ask:

1. **Beat 1 (the moment):** "What actually happened that day / that week?"
   — Pull for specifics. If they say "we were running out of money," ask: "what was the specific moment you realized that?"

2. **Beat 2 (what it felt like):** "What was going through your head? Not the business logic — what did it feel like personally?"
   — This is the hardest beat to get. Founders will default back to the operational narrative. Redirect: "forget the company for a second — what were you afraid of?"

3. **Beat 3 (what shifted):** "Was there a moment when something changed — not necessarily the outcome, just something in how you were seeing it?"
   — Watch for silver linings and reframe them. "And then I realized it was actually an opportunity" is not beat 3. Probe: "before that realization, what actually changed? Was it a conversation? Something someone said?"

4. **Beat 4 (what they carried):** "What did you take forward from that? Not a lesson — something specific you now know or do differently."

---

**What to avoid in the conversation**

- **Don't ask "how did it turn out?"** — irrelevant to the arc and pulls them out of the moment into retrospective mode
- **Don't offer your own framing** — "so it sounds like you were afraid of X?" closes the answer before they've found it themselves
- **Don't rush beat 2** — it's the hardest one and founders will skip it if you let them. Sit in the silence.
- **Don't let them abstract** — every time an answer drifts to "as a founder, you have to..." redirect to "but in that specific moment, what did YOU feel?"

---

**After the conversation**

You write the arc, not them. Take your notes from the conversation, shape it into the 4-beat format, keep it under 8 sentences total. Then send it back:

> "Here's what I wrote from our conversation. Does this feel accurate? Anything you'd want changed or removed?"

Two reasons to do it this way:
1. Founders won't write it — they'll stall or over-polish it
2. You control the format and quality, they just approve or adjust

Give them full control on attribution: anonymous (default), first name only, or full name. Make it easy to say anonymous — that's the option that keeps the arc honest.

---

**Where to find the conversations**

- **Cold DM on Twitter/X** — founders who have posted honestly about hard moments are already self-selected. Reference the specific post.
- **Accelerator alumni Slack channels** — one message to the right channel gets you 5-10 willing founders if the ask is framed right
- **Your own network first** — the first 5 arcs should come from people who trust you. Quality control is easier, and it seeds the right tone.
- **Indie Hackers forum** — post asking for "founders willing to share a specific hard moment for a new tool." Be honest about what you're building.

Target: 15 arcs before launch. Talk to 25 founders to get 15 usable ones — some conversations won't yield a real arc, and that's fine.

---

### Growth Path

**V2 — Semantic matching**

Replace keyword matching with embedding-based similarity. "Launch silence" matches arcs about post-launch emptiness, not just arcs that contain those words.

**V3 — History-based personalization (requires account)**

`arc --patterns` becomes meaningful. With session history, the system knows your recurring threads. The match draws from what keeps coming up for you specifically, not just the current moment.

**V4 — Contribution flow**

After a heavy session that resolved (mirror confirmed, mood lighter at session end):

```bash
$ unsaid debrief

──────────────────────────────────────────
You showed up.
──────────────────────────────────────────

Want to contribute this one to the Arc library?
[y to start / n to skip]
```

If yes: guided 4-beat prompts. Anonymous by default, optionally attributed. Goes into review queue — nothing goes live until curated. The founder controls attribution.

**V5 — Cohort arc libraries**

Accelerator partners (YC, Antler, Founders Factory) can sponsor a cohort-specific collection. Arcs from W24 go into a W24 library. Founders in that cohort see "from your batch" as a filter. More relevant matching, concrete value for accelerator partners to offer their cohort.

**V6 — Resonance signal**

When an arc lands (founder lingers, pulls another from the same match, or explicitly marks it), that signal feeds back into the matching algorithm. Slow quality filter — not a recommendation engine, just a way to surface what consistently resonates over time.

---

### What Makes an Arc Fail

Worth naming explicitly because the failure mode is subtle:

- **Too polished** — reads like a LinkedIn post about adversity. No one recognizes themselves in it.
- **Too abstract** — "I learned that resilience is what separates founders." Useless.
- **Too positive** — beat 3 becomes a silver lining instead of a specific small thing. The arc sounds like it resolved cleanly. Real ones don't.
- **Missing beat 2** — describes the event again instead of naming what it actually felt like. "I was overwhelmed" is not beat 2. "I felt like I'd been lying to everyone about who I was" is beat 2.

The review queue before anything goes live exists specifically to catch these.

---

### Relationship to `unsaid`

Arc is the same library, two access points, two different emotional states:

- **From inside `unsaid`** — offered after the mirror on heavy sessions. The founder just named something heavy. Arc says: someone else held this and came through. Posture: raw, still inside it.
- **Standalone `arc`** — you're not processing, you want fuel. You pull an arc the way you'd read something that reminds you why this matters. Posture: curious, looking for something to hold onto.

Same content. Different moment. Both valid.

---

### Relationship to Xolace

`arc` shares the same Convex backend and Clerk auth as `unsaid` and the Xolace mobile app. The Arc library is one pool — accessible from the CLI, from inside `unsaid`, and eventually from within the Xolace app itself. A contribution made through the CLI goes into the same library a mobile user might draw from.
