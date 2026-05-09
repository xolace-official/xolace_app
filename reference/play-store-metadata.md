# Play Store Metadata — Xolace (Android)

Last updated: 2026-05-09

---

## Live Metadata (Google Play Console)

### Title
```
Xolace: AI for self-reflection
```
30/30 chars — matches iOS title exactly

### Short Description (80 chars max — indexed heavily by Google's algorithm)
```
AI mirrors your emotions back clearly. Private. No therapy. No judgment.
```
72/80 chars

> This field has no iOS equivalent. It appears above the fold in search results and
> is weighted similarly to the title for keyword ranking. Contains "emotions" and
> "AI" without repeating the title phrase.

### Full Description (4000 chars max — Google indexes keywords throughout)

```
Most people aren't okay — they're just not sure what's wrong.

You open Xolace when something feels off but you can't name it. Heavy. Tight. Numb. Distant. You write or speak a few words or tap how your body feels and the AI mirrors it back with more precision than you found yourself:

"There's a weight in your chest, like you've been carrying something you haven't said out loud yet."

That's the moment. Most apps ask you to track emotions you've already named. Xolace finds the words with you.

WHAT HAPPENS IN A SESSION
• Answer "What's here right now?"; write freely or tap texture words
• Read or listen to the AI reflection; 1-3 sentences that name what you're carrying
• Choose your path: a quiet exercise; anonymous peer perspectives; or simply close knowing you were heard

Sessions take 3–8 minutes. No streaks. No feed. No one watching.

WHO THIS IS FOR
For the moments when something is here and you can't name it yet. When you feel anxious but don't know why. When you're numb and don't know how to start. When you're overwhelmed and therapy feels too far away.

Xolace sits in the gap between "everything is fine" and "I need professional help." That gap is where most people spend most of their time.

WHAT MAKES XOLACE DIFFERENT
Most mental wellness and mood tracking apps assume you already know what you feel. Xolace exists one layer earlier — the layer where people get stuck before they can reach any other kind of support.

The AI isn't a companion or a therapist. It's a mirror. It reflects and exits. Every session is complete in itself.

PRIVACY BY DESIGN
Your emotional data is separated from your identity at the infrastructure level. No ads. No data sales. Anonymous contributions are structurally disconnected from your account.

WHAT XOLACE IS NOT
Not therapy or crisis support - if you're in danger, please contact a crisis line.
Not an AI companion - the mirror reflects and exits. Every time.
Not a social platform - no profiles, no followers, no performance.
Not a mood tracker - you don't need to already know what you feel.

For the moments when something is here, and you can't name it yet.
```

> **iOS vs Android:** The first four paragraphs and the three closing sections are
> identical to the iOS description. The "WHO THIS IS FOR" and "WHAT MAKES XOLACE
> DIFFERENT" sections are Android additions — they add keyword surface area
> (anxious, overwhelmed, mood tracking, mental wellness) that Google's algorithm
> weights at 15% for ranking. iOS description carries only ~5% weight so the
> shorter version is fine there.

---

## Screenshot Storyboard (8 slots)

Slots 1–2 appear in search results before tapping in. Priority order:

| Slot | Screen | Overlay text |
|------|--------|--------------|
| 1 | Idle — "What's here right now?" | `Name what you're carrying` |
| 2 | AI mirror reveal | `The AI finds words you couldn't` |
| 3 | Path selection | `Then choose what you need` |
| 4 | Peer reflections | `See that you're not alone in it` |
| 5 | Sit With This / exercise | `Or sit quietly with what's here` |
| 6 | Session end — "You showed up" | `Complete in itself. No streak guilt.` |
| 7 | Privacy visual | `Your data. Separated from your identity.` |
| 8 | Onboarding promise screen | `Not therapy. Not a companion. Just clarity.` |

> Slots 1–6 match the iOS storyboard exactly. Slots 7–8 collapse the iOS slots
> 8–10 (privacy, timeline, onboarding) into 2 to fit the 8-slot limit.
> "Texture words / tag input" (iOS slot 7) and "Timeline" (iOS slot 9) are cut —
> lowest priority for conversion.

Required format: portrait, minimum 1080×1920px (16:9 or 9:16). Test overlay text
legibility at Android thumbnail size (approximately 180×320px rendered in search).

### Feature Graphic (1024×500px — required for editorial featuring)

A separate banner asset displayed above screenshots on tablets and in some
editorial placements. No iOS equivalent.

Recommended: dark background (matches app aesthetic) + ember orb or "What's here
right now?" prompt centered + tagline below. Keep text minimal — this renders at
varying sizes across devices.

---

## Rating Prompt

Same implementation as iOS. `expo-store-review` handles both platforms:

```tsx
import * as StoreReview from 'expo-store-review';
import { useEffect, useRef } from 'react';

const hasRequestedReview = useRef(false);

useEffect(() => {
  if (variant !== 'activity' || hasRequestedReview.current) return;

  const maybeRequestReview = async () => {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    setTimeout(async () => {
      hasRequestedReview.current = true;
      await StoreReview.requestReview();
    }, 2500);
  };

  maybeRequestReview();
}, [variant]);
```

Trigger: `SessionEnd`, activity variant only (solo or peers path completed), 2.5s
after the screen loads. Identical trigger logic to iOS.

Android has no OS-level rate limit (unlike iOS's once-per-365-days gate), but
Google's Play In-App Review API enforces its own quota internally. Call it at the
right moment every time and let the API decide.

---

## Data Safety Section (Play Console → Store presence → Data safety)

No iOS equivalent — Apple has Privacy Nutrition Labels, Play has Data Safety form.
This must be complete and consistent with the privacy policy or the listing shows
a warning.

| Category | Collected | Shared | Encrypted | User can delete |
|----------|-----------|--------|-----------|-----------------|
| User content (reflections) | Yes | No | Yes | Yes |
| App activity (session metadata) | Yes | No | Yes | Yes |
| Personal info (email via Clerk) | Yes | No | Yes | Yes |
| Device identifiers | No | — | — | — |
| Financial info | No | — | — | — |
| Location | No | — | — | — |

All collected data: not shared with third parties, used only for app functionality,
and deletable on account deletion.

---

## Execution Checklist

- [ ] Title updated in Play Console (`Xolace: AI for self-reflection`)
- [ ] Short description written and set (72/80 chars)
- [ ] Full description updated with Android additions
- [ ] Feature graphic created and uploaded (1024×500px)
- [ ] Screenshots uploaded — all 8 slots, portrait, 1080×1920px minimum
- [ ] Preview video recorded and uploaded (30s max, autoplays in listing)
- [ ] Data safety section complete and consistent with privacy policy
- [ ] Rating prompt code confirmed live on Android build
- [ ] What's New field updated on next release

---

## Notes

- Title matches iOS exactly — "journal" rejected for same reason as iOS (expectation
  mismatch drives wrong-audience installs)
- Short description absorbs "emotions" and "mood" keywords that iOS carries in the
  subtitle ("Understand your mood & anxiety") — different field, same function
- Android has no keyword field; all keyword coverage comes from title, short
  description, and full description
- Full description expanded vs iOS version to exploit Google's 15% description
  ranking weight — iOS description unchanged
- Target: 100+ installs before any paid UA or distribution event; 500+ ratings
  before Product Hunt or major press
