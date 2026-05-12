# Founder Welcome Message — Feature Plan

## What It Is

A bottom sheet that rises from the home screen the first time a user lands on `(protected)/index`. It shows a warm personal letter from the founder (Nathaniel), covering: welcome, product vision, trust/privacy, and how to get the best from the app. It is dismissed by tapping the CTA button only — no swipe, no backdrop tap.

It re-shows if the local persistence flag is `false` (e.g. fresh install, cleared data). Every user sees it once — new and existing — at ship time.

---

## UI Design

### Surface
- `heroui-native` `BottomSheet` component (same pattern as `swap-sheet.tsx`, `legal-bottom-sheet.tsx`)
- Blurred dark backdrop — **`FounderWelcomeBlurOverlay`** (new component, non-dismissible variant of `BottomSheetBlurOverlay`) — intensity 60–80
- `snapPoints={[SHEET_HEIGHT]}` where `SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 560)`
- `enablePanDownToClose={false}` — also blocks Android back button (heroui-native wires BackHandler internally and skips registration when this is false)
- `handleIndicatorClassName="opacity-0"` — hides the drag handle (photo replaces it visually)
- `enableDynamicSizing={false}`

### Visual Hierarchy (top → bottom)
```
1. Founder photo (circular, 72px diameter)
   - Bundled asset: assets/images/founder-photo.jpg
   - expo-image, circular crop (borderRadius: 36)
   - Positioned absolutely, centered, -36px above sheet top edge
   - accessibilityLabel="Nathaniel, Founder of Xolace"

2. Greeting — "hey." 
   - Poppins Light, 30px, text-foreground
   - Left-aligned, paddingTop: 48 (clears photo)

3. Body — 4 short paragraphs (BottomSheetScrollView)
   - Paragraph spacing: 16px between each
   - Poppins Regular, 15px, leading-7, text-foreground/80
   - Left-aligned

   [welcome]  "you found the space for feelings that don't have names yet."
   [vision]   "this isn't a chatbot or a journal. it's infrastructure for your inner life — quiet, daily, no performance required."
   [trust]    "your words are private. ephemeral. never stored, never seen, never trained on."
   [how-to]   "one question. write whatever is true. let it land here."

4. Signature area (inside scroll zone, below paragraphs)
   - "with care," in Poppins Italic, 14px, text-foreground/60
   - Bundled signature image: assets/images/founder-signature.png
     (white ink on transparent, ~120×40px, contains name + hand-drawn heart)
   - paddingTop: 24

5. CTA button — PINNED outside scroll (not inside BottomSheetScrollView)
   - PressableFeedback from heroui-native
   - Full width, mx-6, height: 52px (≥44px touch target)
   - bg-accent, rounded-2xl
   - Label: "I'm ready"
   - Poppins Medium, 16px, white
   - accessibilityLabel="I'm ready"
   - accessibilityRole="button"
   - onPress: sets founderWelcomeSeen = true → closes sheet
```

### Layout Structure
```
<BottomSheet snapPoints={[SHEET_HEIGHT]} ...>
  <BottomSheet.Content backgroundClassName="bg-background">
    {/* founder photo — absolute, overlaps top */}
    <Image source={founderPhoto} style={[styles.photo, {position:'absolute', top:-36, alignSelf:'center'}]} />
    
    {/* scrollable letter */}
    <BottomSheetScrollView contentContainerStyle={{px:24, pt:48, pb:24}}>
      <AppText style={{fontFamily:'Poppins-Light', fontSize:30}}>hey.</AppText>
      {/* 4 paragraphs with mb:16 between */}
      {/* signature area */}
    </BottomSheetScrollView>
    
    {/* pinned CTA */}
    <View style={{px:24, pb:safeAreaBottom, pt:12}}>
      <PressableFeedback onPress={handleDismiss} style={{...ctaStyle}}>
        <AppText>I'm ready</AppText>
      </PressableFeedback>
    </View>
  </BottomSheet.Content>
</BottomSheet>
```

---

## Logic

### Store slice (`src/store/store.ts`)
Add to `OnboardingSlice` alongside `introSeen` (semantically correct — both are one-time-seen flags):
```typescript
founderWelcomeSeen: boolean;
setFounderWelcomeSeen: (v: boolean) => void;
```
Add to `partialize`: `founderWelcomeSeen: s.founderWelcomeSeen`
Default value: `false`

### Trigger (`src/app/(protected)/index.tsx`)
```typescript
const founderWelcomeSeen = useAppStore((s) => s.founderWelcomeSeen);
const [showWelcome, setShowWelcome] = useState(false);

useEffect(() => {
  if (founderWelcomeSeen) return;
  const t = setTimeout(() => setShowWelcome(true), 400);
  return () => clearTimeout(t);
}, [founderWelcomeSeen]);
```

### Dismiss handler
```typescript
const handleDismiss = () => {
  setFounderWelcomeSeen(true);
  setShowWelcome(false);
};
```

### Android back button
Handled automatically by `enablePanDownToClose={false}`. heroui-native's `BottomSheetContentContainer` only registers `BackHandler.addEventListener` when `enablePanDownToClose` is `true` — no manual handler needed, no new package required.

### Trigger timing
- `useEffect` on mount → 400ms `setTimeout` → `setShowWelcome(true)` → sheet animates up
- Spring animation via heroui-native BottomSheet default (no custom config needed)

---

## File Structure

```
src/
  features/
    founder-welcome/
      components/
        founder-welcome-sheet.tsx          ← the bottom sheet component
        founder-welcome-blur-overlay.tsx   ← non-dismissible blur backdrop (reuses AnimatedBlurView)
  app/
    (protected)/
      index.tsx                      ← add showWelcome state + FounderWelcomeSheet render
  store/
    store.ts                         ← add founderWelcomeSeen slice
assets/
  images/
    founder-photo.jpg                ← needs to be added (circular crop ok in app)
    founder-signature.png            ← needs to be added (white ink, transparent bg)
```

Follows the "no new horizontal files" rule — component lives in `features/founder-welcome/` not `hooks/` or `components/shared/`.

---

## Interaction States

| State | Behavior |
|---|---|
| First open | 400ms after home mount → sheet rises |
| CTA tap | `founderWelcomeSeen=true` persisted → sheet closes |
| Backdrop tap | No-op (not a dismiss trigger) |
| Swipe down | No-op (`enablePanDownToClose=false`) |
| Android back | No-op (heroui-native skips BackHandler when `enablePanDownToClose=false`) |
| Subsequent opens | `founderWelcomeSeen=true` → no sheet shown |
| Fresh install / data clear | `founderWelcomeSeen=false` → sheet shows again |

---

## A11y

- Sheet container: `accessibilityViewIsModal={true}`
- Founder photo: `accessibilityLabel="Nathaniel, Founder of Xolace"`
- CTA: `accessibilityLabel="I'm ready"`, `accessibilityRole="button"`
- Backdrop: not focusable
- CTA height ≥ 52px (exceeds 44px minimum touch target)

---

## NOT In Scope

- Analytics event on welcome seen (can add later)
- Ability to re-read the welcome from settings (can add as a settings toggle)
- Web platform support (sheet behavior differs on web, defer)
- Localization (English only for now)
- Dark/light mode variants of the founder photo (single asset works across both)

---

## What Already Exists (reuse)

- `BottomSheet` / `BottomSheetScrollView` / `BottomSheet.Content` — `heroui-native` (wraps gorhom internally)
- `AnimatedBlurView` — `src/components/animated-blur-view.tsx` — reused by new `FounderWelcomeBlurOverlay`
- `useBottomSheetAnimation` from `heroui-native` — provides the `progress` value for blur intensity animation
- `BottomSheetBlurOverlay` — NOT reused directly (it dismisses on backdrop tap); new non-dismissible variant created instead
- Zustand `persist` + `partialize` pattern — `src/store/store.ts`
- `AppText` — `src/components/shared/app-text.tsx`
- `PressableFeedback` — `heroui-native`
- `expo-image` for the photo
- `useSafeAreaInsets` for bottom padding

---

## Assets Needed (before coding)

1. `assets/images/founder-photo.jpg` — founder photo, ideally ~200×200px, face centered (app will crop circular)
2. `assets/images/founder-signature.png` — handwritten signature + hand-drawn heart, white ink, transparent background, ~240×80px @2x

Both assets must be provided before the component can be completed.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 3 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score: 3/10 → 9/10, 9 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT: ENG + DESIGN CLEARED — ready to implement.**
