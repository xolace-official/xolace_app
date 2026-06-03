# Launch Plan — 1.4.0.0 / Trusted Bridge

> Type: Major feature update on a live app · Budget: Organic only · Markets: Ghana + US first
> Channels: existing app users (push), social following, email/WhatsApp list
> **Today: Wed Jun 3, 2026 · Launch Day: Tue Jun 9, 2026** (adjust anchor; rest shifts with it)

## The feature

**Trusted Bridge** — after a session, turns what you felt into a message you can actually send to someone who matters. Suggested from the session-end screen → one-time intro (promise + privacy) → name who you're writing to → AI drafts from your session's emotional context → edit inline → share via native share sheet, or "Not right now." Privacy-first: recipient details never stored. PostHog fires `bridge_open` / `bridge_dismiss` / `bridge_share`.

## The strategic idea

Trusted Bridge is the **first time Xolace's value leaves the app and lands on another human**. Every shared bridge is a non-user receiving an emotionally resonant message that originated in Xolace — a word-of-mouth loop most reflection apps don't have. **Launch goal: maximize bridges sent in week one + instrument the loop.** Shares are the growth engine.

**Lead message (everywhere):**
> "Some things are easier to feel than to say. Xolace now helps you turn what you felt into words you can actually send — to the person who needs to hear them."

Always pair with privacy: *"It drafts from your session. The recipient's details are never stored."*

---

## Phase 1 — Pre-launch sprint (Wed Jun 3 → Mon Jun 8)

**Ship-readiness (today)**
- [ ] Confirm 1.4.0.0 status in App Store Connect + Play Console; submit today if not already (Apple review 24–48h).
- [ ] Ship **metadata v2** (`docs/aso-metadata-v2.md`) with this version — the bump is the natural moment; review rides along. (Caveat: bundling feature + metadata muddies attribution slightly; fine at this scale.)
- [ ] Add **one Bridge screenshot** to both stores (fills a slot — you're at 6/10 iOS — and shows the feature). Caption: "Say what's hard to say."

**Assets (Thu Jun 4 – Fri Jun 5)**
- [ ] **15–20s screen-capture clip** of the Bridge flow (session-end card → name who → AI draft → edit → share). Most reusable asset; caption for sound-off.
- [ ] **Lite story/press kit** (one page): lead message, 3 screenshots, Bridge clip, icon, 2-line founder story, "between fine and therapy" thesis, privacy model.
- [ ] **What's New** text for both stores (below).

**Channel prep (Sat Jun 6 – Mon Jun 8)**
- [ ] Draft push, email, WhatsApp, social thread (all in the Copy Pack below).
- [ ] Pick 2–3 communities and **start contributing now** (Reddit r/mentalhealth, r/Anxiety, r/decidingtobebetter are promo-hostile — need warm presence before launch day or it backfires).
- [ ] Turn on the **in-app rating prompt after a successful bridge share** (new emotional peak; review volume is your #1 ASO blocker).

---

## Phase 2 — Launch Day (Tue Jun 9)

Sequence owned channels for compounding visibility — don't fire all at once.

**Morning**
- [ ] Confirm 1.4.0.0 live + new metadata propagated.
- [ ] **Push** to existing users (deep-link to update if possible).
- [ ] **Social thread** (founder account, X/LinkedIn), embed Bridge clip.
- [ ] **WhatsApp broadcast** (Ghana warm list).

**Midday**
- [ ] **Email** the list.
- [ ] **Community posts** (only where warmed) — story-led, founder voice, not "check out my app."
- [ ] Reply to every comment/review within the hour.

**Evening**
- [ ] Watch PostHog `bridge_open` / `bridge_share`. Thank early adopters. Share any milestone ("100 bridges sent day one").

---

## Phase 3 — Week 1 (Jun 9 → Jun 15)

- [ ] Post once daily — rotate: privacy model, example draft, the thesis, behind-the-build.
- [ ] Respond to all reviews.
- [ ] Watch keyword indexing (`ai journal`, `mood`, `anxiety relief`) after metadata change.
- [ ] Follow up once with any press/creators who didn't reply.
- [ ] Optional: Product Hunt mid-week (Tue–Thu) — lower leverage for a feature update; only if you can rally hunters.

## Phase 4 — Month 1 (through ~Jul 9)

- [ ] Full `/aso-audit` with real data; finalize un-validated keywords (`worry`/`sad`/`panic`).
- [ ] Title test: commit new iOS title (sequential read); run the **Android** Play Listing Experiment (`AI Mood & Feelings` vs `AI Feelings & Mood`).
- [ ] Fill remaining screenshot slots (voice input, daily quotes deserve frames).
- [ ] Analyze the Bridge funnel; decide next iteration.

---

## Success metrics (organic, early-stage)

Funnel: `session_end` → `bridge_card_seen` → `bridge_open` → `draft_generated` → **`bridge_share`**

| Metric | Week 1 | Month 1 |
|---|---|---|
| Bridge open rate (opens ÷ card seen) | ≥ 15% | ≥ 20% |
| Bridge share rate (shares ÷ opens) | ≥ 30% | ≥ 40% |
| **Bridges shared** (growth number) | 50+ | 300+ |
| New ratings (both stores) | +10 | +40 |
| Indexing for `ai journal` / `mood` | indexed | top-100 |
| Update adoption (existing users on 1.4.0.0) | 40% | 75% |

**Obsess over share rate** — the only metric that turns a feature into a loop. High opens + low shares = draft quality or share friction, not awareness.

## ⚠️ Get-right list (category-specific)

1. **Framing:** "send a message to someone who matters" = helping you say something hard to people *you choose*. Never reads as prompting outreach. Consent-forward copy throughout.
2. **Communities reject pitches.** Founder story + genuine prior contribution, or don't post.
3. **Don't stack experiments.** Ship metadata v2 + 1.4.0.0 as one event; hold other changes ~2 weeks to read signal cleanly.

---

# 📣 Launch-Day Copy Pack

Voice: quiet, precise, emotional. Not salesy. The campfire/"name what you're carrying" register.

## What's New (App Store + Play)
```
NEW: Trusted Bridge 🌉
Some things are easier to feel than to say. After a session, Xolace can now
turn what you felt into a message you can actually send — to a friend, a
partner, a parent. The AI drafts it from your reflection; you edit it; you
choose to send or not. Nothing sends itself. Recipient details are never stored.
```

## Push notification (existing users)
**Primary:**
> **Trusted Bridge is here 🌉**
> Turn what you feel in your next session into words you can actually send.

**Alt (softer):**
> **Some things are easier to feel than to say.**
> Now Xolace helps you send them. Tap to update. 🌉

## Email
**Subject:** Some things are easier to feel than to say
**Preview:** Trusted Bridge turns what you felt into words you can send.

> Hi [first name],
>
> Most of what we carry never gets said. Not because we don't want to — because we can't find the words in the moment they'd matter. By the next day, it's gone. Unsaid.
>
> Today we shipped the biggest Xolace update yet: **Trusted Bridge.**
>
> After a session, Xolace can take what you just felt and help you turn it into a message you can actually send — to a friend, a partner, a parent, anyone who needs to hear it. The AI drafts it from your reflection. You edit every word. You decide whether to send it or not. Nothing sends itself, and the person's details are never stored.
>
> It's for the moments where something is here, and you finally want to let someone in.
>
> **Update Xolace and try it after your next session →** [link]
>
> And as always — just reply and tell me what you think. I read everything.
>
> — [Founder name]
> Xolace

## WhatsApp broadcast (Ghana, founder voice)
> Hey 🙏 Just shipped the biggest Xolace update yet — **Trusted Bridge.** After a session, it helps you turn what you're feeling into a message you can actually send to someone who matters. I made it for the moments where you feel something but can't find the words. Would mean a lot if you updated and tried it — and told me what you think. 🌉

## Social thread (X / LinkedIn — founder, build-in-public)
**1/**
> Most of what we carry never gets said.
>
> Not because we don't want to — because we can't find the words in the moment they'd matter.
>
> Today we shipped the feature I'm most proud of at Xolace: Trusted Bridge. 🧵

**2/**
> Xolace helps you name what you're feeling.
>
> But naming it to yourself is only half of it. The other half is the person you wish you could say it to.

**3/**
> After a session, Trusted Bridge takes what you just felt and helps you turn it into a message you can actually send.
>
> You choose who. The AI drafts it from your reflection. You edit every word.

**4/**
> The rules we built it on:
> • Nothing sends itself — you always choose
> • You edit the whole draft
> • The recipient's details are never stored
>
> It reflects and exits. Same as the rest of Xolace.

**5/** [attach Bridge clip]
> Here's the whole flow — session → who you're writing to → draft → edit → send.

**6/**
> It's live now in 1.4.0.
>
> If you've ever felt something you couldn't say out loud to someone who mattered — this is for you. 🌉
>
> [App Store link] · [Google Play link]

## Community posts (story-led, non-promo — follow each sub's self-promo rules)

**A — Mental-health community (value-first, ends on a question):**
> **Title:** I kept feeling things I couldn't say to the people I love. So I built something to help.
>
> For years I'd have these moments — usually late — where I'd feel something heavy about someone close to me and just couldn't find the words to tell them. By morning it was gone, unsaid.
>
> I've been building a small app that helps you name what you're feeling. This week I added the part I actually needed myself: after you reflect, it helps you turn what you felt into a message you can send to the person it's about. You edit everything, nothing sends without you, and it doesn't store who you're writing to.
>
> Not trying to pitch — more curious whether other people have this same gap between feeling something and being able to say it. How do you handle it?

**B — Indie/maker community (r/SideProject, Indie Hackers):**
> **Title:** Shipped the feature I was scared to build — turning a private reflection into a message you can actually send
>
> My app helps people name what they're feeling. The risky part I just shipped: after a session, an AI drafts a message — based on what you reflected — to someone who matters. You edit it fully; nothing auto-sends; recipient details are never stored.
>
> The hard design calls were all about restraint: how to draft something emotionally accurate without it feeling generated, and how to make "don't send" as easy as "send." Happy to go into the privacy model or the prompt design if useful.

**C — LinkedIn (founder, professional-warm):**
> There's a gap most products ignore: the distance between feeling something and being able to say it to the person it's about.
>
> Today we shipped Trusted Bridge in Xolace. After a reflection, it helps you turn what you felt into a message you can send — drafted from your session, fully editable, never auto-sent, and it stores nothing about the recipient.
>
> We build on one principle: the tool reflects and exits. It doesn't become the relationship. It hands you back to the people in your life. 🌉
