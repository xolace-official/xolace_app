# Reflect Screen Tour Guide — Approved Implementation

Reviewed and approved via /plan-ceo-review + /plan-eng-review (2026-05-30).

---

## What it is

A one-time, 4-step popover tour on the idle (reflect) screen. Shows the first time a user reaches the screen. Never shows again after completion or skip.

---

## Files

| File | Change |
|---|---|
| `src/store/store.ts` | Add `reflectTourSeen: boolean` to `TogglesSlice`, persisted |
| `src/features/reflect/tour-copy.ts` | NEW — step titles + descriptions |
| `src/features/reflect/hooks/use-reflect-tour.ts` | NEW — reducer + state |
| `src/features/reflect/components/states/idle-state.tsx` | Wrap 4 elements + overlay |

---

## Tour Steps

| Step | Element | Title | Description |
|---|---|---|---|
| 0 | Tap-to-write `Pressable` | "Start by writing." | "Tap here and type whatever's on your mind." |
| 1 | `MicButton` (absolute right-2 top-2) | "Or speak instead." | "Tap this button to record your voice." |
| 2 | `TagGroup` (texture tags) | "Tap words that fit." | "Select any that match how you feel right now." |
| 3 | `TextureSetTabs` | "Switch word sets." | "Different sets for different moods." |

Step 3 is skipped when `isNight === true`.

---

## tour-copy.ts

```ts
export const TOUR_STEPS = [
  { title: 'Start by writing.', description: "Tap here and type whatever's on your mind." },
  { title: 'Or speak instead.', description: 'Tap this button to record your voice.' },
  { title: 'Tap words that fit.', description: 'Select any that match how you feel right now.' },
  { title: 'Switch word sets.', description: 'Different sets for different moods.' },
] as const;
```

Step 3 (index 3) is the conditional one. The hook filters it out at night.

---

## use-reflect-tour.ts — shape

```ts
type TourState = {
  currentStepIndex: number;
  isActive: boolean;
  isComplete: boolean;
};

type TourAction =
  | { type: 'START_TOUR' }
  | { type: 'NEXT_STEP' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'SKIP_TOUR' };

export function useReflectTour() {
  const { reflectTourSeen, setReflectTourSeen } = useAppStore();
  const { isNight } = useSessionMode();

  const steps = useMemo(() =>
    isNight ? TOUR_STEPS.slice(0, 3) : TOUR_STEPS,
    [isNight]
  );

  const [tourState, dispatch] = useReducer(tourReducer, {
    currentStepIndex: 0,
    isActive: false,
    isComplete: false,
  });

  const isAdvancing = useRef(false);

  // Start tour on mount if not yet seen
  useEffect(() => {
    if (!reflectTourSeen) {
      const t = setTimeout(() => dispatch({ type: 'START_TOUR' }), 800);
      return () => clearTimeout(t);
    }
  }, [reflectTourSeen]);

  // Advance to next step with delay; complete when past last step
  useEffect(() => {
    if (!tourState.isActive) return;
    if (tourState.currentStepIndex >= steps.length) {
      dispatch({ type: 'COMPLETE_TOUR' });
      setReflectTourSeen(true);
      posthog.capture('tour_completed');
    }
  }, [tourState.currentStepIndex, tourState.isActive, steps.length]);

  const advance = useCallback(() => {
    if (!tourState.isActive || isAdvancing.current) return;
    isAdvancing.current = true;
    dispatch({ type: 'NEXT_STEP' });
    setTimeout(() => { isAdvancing.current = false; }, 600);
  }, [tourState.isActive]);

  const skip = useCallback(() => {
    dispatch({ type: 'SKIP_TOUR' });
    setReflectTourSeen(true);
    posthog.capture('tour_skipped', { at_step: tourState.currentStepIndex });
  }, [tourState.currentStepIndex]);

  return { tourState, steps, advance, skip };
}
```

**Completion check uses `steps.length` — never a hardcoded 4.** This is what makes Night Mode work correctly (3 steps → completes after step index 2).

---

## idle-state.tsx — Popover pattern

### Critical rules (both from source verification + sample code)

**1. Use controlled `isOpen` mode — no imperative refs.**

```tsx
<Popover
  isOpen={tourState.isActive && tourState.currentStepIndex === STEP_IDX}
  onOpenChange={() => {}}  // noop — user press never toggles
>
```

Without controlled mode, `Popover.Trigger` auto-toggles the popover on press. After tour completion, tapping the write area or mic button would reopen the tour popover.

**2. Do NOT include `Popover.Overlay` inside tour Popovers.**

```tsx
<Popover.Portal>
  {/* NO <Popover.Overlay /> here */}
  <Popover.Content presentation="popover" placement="top">
    <Popover.Arrow ... />
    <Popover.Title>...</Popover.Title>
    <Popover.Description>...</Popover.Description>
  </Popover.Content>
</Popover.Portal>
```

`Popover.Overlay` sits in the FullWindowOverlay and captures all taps outside the content. The tour overlay (AnimatedPressable at screen level) never receives those taps — tour gets stuck on every step. Without `Popover.Overlay`, the Portal container's `pointerEvents="box-none"` lets taps pass through to the AnimatedPressable.

**3. Use `Popover.Trigger` without `asChild` for complex components.**

`asChild` (Slot pattern) clones the child and merges handlers. It breaks on components that don't forward refs (`MicButton`, `TextureSetTabs`, `TagGroup`). Without `asChild`, the Trigger is itself a Pressable container that wraps the element and acts as the anchor.

```tsx
// Write area (Step 0) — Pressable supports asChild
<Popover isOpen={...} onOpenChange={() => {}}>
  <Popover.Trigger asChild>
    <Pressable onPress={handleTap} className="flex-1">
      ...
    </Pressable>
  </Popover.Trigger>
  <Popover.Portal>...</Popover.Portal>
</Popover>

// MicButton (Step 1) — complex component, no asChild
<Popover isOpen={...} onOpenChange={() => {}}>
  <Popover.Trigger>
    <View className="absolute right-2 top-2">
      <MicButton ... />
    </View>
  </Popover.Trigger>
  <Popover.Portal>...</Popover.Portal>
</Popover>
```

### Tour overlay

```tsx
{tourState.isActive && (
  <AnimatedPressable
    entering={FadeIn.delay(1000)}
    exiting={FadeOut}
    style={StyleSheet.absoluteFill}
    onPress={advance}
    className="bg-black/25"
    accessibilityLabel="Tour guide, tap to continue"
  >
    <View className="absolute top-safe right-6">
      <PressableFeedback onPress={skip} accessibilityLabel="Skip tour">
        <AppText className="text-white/60 text-sm">Skip</AppText>
      </PressableFeedback>
    </View>
  </AnimatedPressable>
)}
```

---

## Timing

| Event | Delay |
|---|---|
| Tour start after idle screen mount | 800ms |
| Between steps (close previous, open next) | 500ms |
| isAdvancing debounce (prevents double-fire) | 600ms |

---

## Zustand (store.ts)

Add to `TogglesSlice` and `partialize`:

```ts
reflectTourSeen: boolean;
setReflectTourSeen: (v: boolean) => void;
```

Default: `false`. Persisted via expo-sqlite.

---

## PostHog events

| Event | When | Payload |
|---|---|---|
| `tour_started` | After first popover opens (not on mount) | — |
| `tour_completed` | All steps finished | — |
| `tour_skipped` | Skip button pressed | `{ at_step: number }` |

`tour_started` fires inside the first step's open effect, not in `START_TOUR` dispatch — avoids false positives if the screen unmounts before the 800ms delay fires.

---

## Night Mode

`isNight` from `useSessionMode()` is passed into `useReflectTour`. The `steps` array is filtered at hook init:

```ts
const steps = useMemo(() =>
  isNight ? TOUR_STEPS.slice(0, 3) : TOUR_STEPS,
  [isNight]
);
```

Completion check: `currentStepIndex >= steps.length` (3 at night, 4 by day). Never hardcoded.

---

## Build order

1. **T0 — Spike** (30 min): Add one hardcoded `isOpen={true}` Popover around the MicButton View in idle-state. Run on iOS simulator. Confirm: popover appears anchored, taps outside Popover.Content reach the screen, no layout breakage. Revert before T1.
2. **T1** — `store.ts`: add `reflectTourSeen`
3. **T2** — `tour-copy.ts`: create file
4. **T3** — `use-reflect-tour.ts`: build hook
5. **T4** — `idle-state.tsx`: wrap elements + overlay
6. **T5** — analytics + a11y labels

Run `/verify` after T4 to confirm tour end-to-end before adding analytics.
