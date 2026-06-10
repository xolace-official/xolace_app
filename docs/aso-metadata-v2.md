# ASO Metadata v2 — Changelist

> Status: Ready to paste · Country: US · Generated from keyword validation (Appeeky) + metadata-optimization pass.
> App: Xolace (iOS App ID `6761601429`; Android live)

Decision: title is `Xolace: AI Mood & Feelings` — **no `journal` in the visible title** (avoids miscategorizing as a journaling app). `journal` is preserved as a ranking target via the hidden iOS keyword field, where `ai` (title) + `journal` (field) still combine into `ai journal`.

---

## 📱 iOS — App Store Connect

> Path: My Apps → Xolace → App Store tab → editable version

### 1. Title — *(requires review)*
```
Xolace: AI Mood & Feelings
```
`26/30`

### 2. Subtitle — *(requires review)*
```
Understand anxiety & stress
```
`27/30`

### 3. Keyword field — *(requires review)*
```
journal,diary,emotional,overwhelmed,burnout,lonely,numb,relief,therapist,tracker,worry,sad,panic
```
`96/100` · no spaces, no repeats of title/subtitle

### 4. Promotional Text — *(NO review — change anytime)*
```
For the moment something's here and you can't name it yet. Write a few words—AI mirrors back what you're carrying with more clarity than you found alone.
```
`152/170`

### 5. Description — replace only the first 2 lines (the hook) — *(requires review)*
```
Most people aren't okay—they're just not sure what's wrong. Open Xolace, write what's here, and AI names the feeling with more precision than you found yourself.
```
`159 chars` · keep the rest of the existing description unchanged.

---

## 🤖 Android — Google Play Console

> Path: Play Console → Xolace → Grow → Store presence → Main store listing
> Note: Play has **no keyword field**. Title + short description + full description are all indexed, so keywords live in the copy itself.

### 1. App name
```
Xolace: AI Mood & Feelings
```
`26/30`

### 2. Short description — *(indexed + visible)*
```
Name your feelings with AI. Understand anxiety, stress & low mood.
```
`66/80` · covers `feelings, anxiety, stress, mood`

### 3. Full description — replace **only the opening paragraph** so indexed keywords are front-loaded; keep everything below it as-is
```
Most people aren't okay, they're just not sure what's wrong. Xolace is an AI mood and feelings journal for the moments you can't name — anxiety, stress, burnout, or just feeling off. Write or speak a few words and the AI mirrors back what you're carrying with more precision than you found yourself.
```
Seeds `mood, feelings, journal, anxiety, stress, burnout` in paragraph one (Play's highest-weighted description zone) without those terms touching the visible title.

---

## ✅ Summary of every change

| Field | From → To |
|---|---|
| iOS Title | `Xolace: AI for self-reflection` → `Xolace: AI Mood & Feelings` |
| iOS Subtitle | `Understand your mood & anxiety` → `Understand anxiety & stress` |
| iOS Keywords | *(old leaky string)* → `journal,diary,emotional,...,panic` (96) |
| iOS Promo text | *(empty)* → 152-char hook |
| iOS Description | hook line refreshed |
| Android title | `Xolace: AI for self-reflection` → `Xolace: AI Mood & Feelings` |
| Android short desc | benefit-only → `Name your feelings with AI...` |
| Android full desc | opening paragraph keyword-front-loaded |

---

## Free keyword combos this layout buys

`ai journal` · `ai diary` · `ai therapist` · `mood tracker` · `anxiety relief` · `stress relief` · `understand anxiety`

(Apple combines words across title + subtitle + keyword field, so `journal`/`tracker`/`therapist` stay live ranking targets without appearing in the visible branding.)

---

## ⚠️ Open items / validation status

- **Validated (Appeeky):** `journal` (volume 58/100). `vent` was dropped after validation (volume 4/100, single-developer dominated).
- **Estimates — confirm next credit cycle:** `worry`, `sad`, `panic`, and the rest of the field. Run `get_app_keywords` (app_id `6761601429`, 1 credit, validates whole field at once); prune anything with volume <10 or developer diversity =1.
- **Dropped vs. earlier draft:** `vent` (dead), `wellbeing` (generic), `calm` (brand term, unrankable), `cbt` (relevance mismatch / bounce risk).
- **Title is the highest-risk change — and iOS cannot A/B test it.** Apple's Product Page Optimization tests only icon/screenshots/video; Custom Product Pages vary only screenshots/video/promo text. Neither can change title/subtitle/keywords. So on iOS the only way to evaluate a new title is a **sequential swap** (make it live, compare ~2–4 weeks of impression→download conversion vs. the prior period — confounded by time, but it's the only option). **Android CAN test it** natively via Play Store Listing Experiments — run `AI Mood & Feelings` vs `AI Feelings & Mood` there, apply the winner. Recommendation: commit the new iOS title (current one wastes weight on `self-reflection` + the `for` stopword), run the real test on Android.

## Appeeky validation — cheapest path next cycle

Do NOT re-run per-keyword `get_keyword_metrics` (1 credit each). Instead spend ~2 credits on:
1. `get_app_keywords` (app_id `6761601429`) — validates the whole field at once.
2. `compare_keyword_cluster` vs Stoic + Ash — real competitor gap list.
