# App Store Metadata — Xolace (iOS)

Last updated: 2026-05-09

---

## Live Metadata (App Store Connect)

### Title
```
Xolace: AI for self-reflection
```
30/30 chars

### Subtitle
```
Understand your mood & anxiety
```
30/30 chars

### Keyword Field (100 chars, no spaces after commas)
```
mood,tracker,wellness,mental,health,reflection,mindfulness,self,care,stress,calm,release,clarity,sad
```
100/100 chars — no repetition from title/subtitle

### Promotional Text (170 chars max, changeable without App Review)
```
A private space to name what you're carrying. AI reflects it back with more clarity than you found yourself. No therapist. No judgment. Just clarity.
```

### Description
```
Most people aren't okay — they're just not sure what's wrong.

You open Xolace when something feels off but you can't name it. Heavy. Tight. Numb. Distant. You write a few words — or tap how your body feels — and the AI mirrors it back with more precision than you found yourself:

"There's a weight in your chest — like you've been carrying something you haven't said out loud yet."

That's the moment. Most apps ask you to track emotions you've already named. Xolace finds the words with you.

WHAT HAPPENS IN A SESSION
• Answer "What's here right now?" — write freely or tap texture words
• Read the AI reflection — 1-3 sentences that name what you're carrying
• Choose your path: a quiet exercise, anonymous peer perspectives, or simply close knowing you were heard

Sessions take 3–8 minutes. No streaks. No feed. No one watching.

PRIVACY BY DESIGN
Your emotional data is separated from your identity at the infrastructure level. No ads. No data sales. Anonymous contributions are structurally disconnected from your account.

WHAT XOLACE IS NOT
Not therapy or crisis support — if you're in danger, please contact a crisis line.
Not an AI companion — the mirror reflects and exits. Every time.
Not a social platform — no profiles, no followers, no performance.

For the moments when something is here, and you can't name it yet.
```

---

## Screenshot Storyboard (10 slots)

Priority order — slots 1–3 appear in search results before "Show All".

| Slot | Screen | Overlay text |
|------|--------|--------------|
| 1 | Idle — "What's here right now?" | `Name what you're carrying` |
| 2 | AI mirror reveal | `The AI finds words you couldn't` |
| 3 | Path selection | `Then choose what you need` |
| 4 | Peer reflections | `See that you're not alone in it` |
| 5 | Sit With This / exercise | `Or sit quietly with what's here` |
| 6 | Session end — "You showed up" | `Complete in itself. No streak guilt.` |
| 7 | Texture words / tag input | `No words? Tap how it feels in your body` |
| 8 | Privacy visual | `Your data. Separated from your identity.` |
| 9 | Timeline | `A private record of what you've carried` |
| 10 | Onboarding promise screen | `Not therapy. Not a companion. Just clarity.` |

Required sizes: 6.7" (iPhone 15 Pro Max) and 6.1" (iPhone 15). Apple serves device-appropriate screenshots.

---

## Rating Prompt

Trigger: `SessionEnd`, activity variant only (solo or peers path completed), 2.5s after the screen loads.
Package: `expo-store-review`

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

Apple rate-limits to once per 365 days per user — call it every time at the right moment and let the OS decide.

---

## Execution Checklist

- [ ] Title updated in App Store Connect
- [ ] Subtitle updated in App Store Connect
- [ ] Keyword field replaced in App Store Connect
- [ ] Promotional text set (no review needed, instant)
- [ ] Description rewritten and submitted
- [ ] Rating prompt code added and shipped
- [ ] Screenshots audited — all 10 slots filled for 6.7" and 6.1"
- [ ] App Preview video recorded and uploaded (20s, autoplays in search)
- [ ] What's New field updated on next release

---

## Notes

- "journal" was considered for the title but rejected — Xolace is not a journaling app and the expectation mismatch drives wrong-audience installs
- "self-clarity" was considered and rejected — not a real search term, internal product language
- Keyword field excludes all terms already in title/subtitle per Apple indexing rules
- Target: 50+ ratings before any paid UA or Product Hunt launch
