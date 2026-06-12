Streak Calendar Reveal — Build Brief

  What we're building

  Replace the muted Day X italic text in QuietReturnHeader (active variant) with a mini desk calendar widget that permanently lives in the
  header. When the user's streak increases, the mini calendar morphs into a full-size version, flips its page to the new day number, fires
  particles, shows a per-day message, then collapses back into the header.

  ---
  Sample code to read first

  All in src/components/extras/sample-codes/ — read every file before building:
  - calendar-days/ — the page-flip calendar (rotateX mechanism, page structure, constants)
  - particles-button/ — the Skia blast particle effect and how to wire it via ref
  - add-to-cart/ — the measure() + absolute-positioned clone pattern (this drives the morph expand/collapse)

  ---
  The animation sequence

  1. QuietReturnHeader renders a mini StreakCalendar (~90px wide) in place of the Day X text — always visible when variant is active
  2. On idle screen mount: if currentStreak > lastAcknowledgedStreak → trigger the reveal
  3. measure() the mini card to get its exact screen position (pageX, pageY, width, height)
  4. Spawn an absolute-positioned full-size calendar starting at those measured coords (same 90px)
  5. Spring-animate it: position moves toward center of screen, size expands to 190px (same as sample's SIZE)
  6. Once expanded: flip plays (old day N-1 → new day N) using the rotateX page mechanism from the sample
  7. At flip apex (progress = 0.5): fire BlastCircleEffect blast + Presets.chirp() haptic
  8. After flip completes: per-day message fades in below the card
  9. User taps anywhere on the card → reverse spring collapses it back to the measured header position → mini card shows updated number →
  setLastAcknowledgedStreak(currentStreak)

  ---
  Files to create

  src/features/reflect/components/streak-calendar/
    constants.ts          — card sizes for mini (90px) and full (190px), adapted from sample constants
    flip-page.tsx         — the rotateX page flip (adapted from sample's Page + PageFace + usePageFlipAnimation)
    blast-particles.tsx   — BlastCircleEffect adapted to accept a `color` prop (sample hardcodes white)
    streak-flip-card.tsx  — the calendar card UI (header + body + static halves + flip page), renders at whatever size is passed
    streak-calendar.tsx   — orchestrator: holds the mini card + the absolute-positioned reveal overlay, runs the full sequence
    index.ts              — barrel export

  src/features/reflect/streak-copy.ts   — per-day messages, every day 1–100+

  ---
  Files to modify

  src/store/store.ts
  - Add lastAcknowledgedStreak: number to TogglesSlice type (default 0)
  - Add setter setLastAcknowledgedStreak: (n: number) => void
  - Add lastAcknowledgedStreak to the partialize() call — MUST be in both the type and partialize or it won't survive cold start

  src/features/reflect/components/quiet-return-header.tsx
  - In the active variant path, replace the Day X <AppText> with <StreakCalendar currentStreak={variant.dayCount} />
  - StreakCalendar reads lastAcknowledgedStreak from the store internally

  ---
  Key adaptations from the sample code

  ┌───────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                Sample                 │                                              Ours                                              │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Slider drives progress 0→1            │ withSpring fires automatically on mount when triggered                                         │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ 31 pages                              │ Single flip: totalPages = 1, front = N-1, back = N                                             │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ SIZE = 190 fixed                      │ Two sizes: mini (~90px) in header, full (190px) during reveal                                  │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ SF-Pro-Rounded-Bold 90px              │ Poppins (already loaded), scale font size proportionally                                       │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Hardcoded #f5655b / #FFFFFF           │ CSS vars: --accent for header, --surface for body, --foreground for number — use useThemeColor │
  │                                       │  from heroui-native                                                                            │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ BlastCircleEffect color hardcoded     │ Add color prop, pass accent color                                                              │
  │ #ffffff                               │                                                                                                │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ scheduleOnRN(Haptics)                 │ Presets.chirp() from react-native-pulsar at apex                                               │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ StaticPage uses useSafeAreaInsets     │ Remove — not needed mid-screen                                                                 │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ measure() called from worklet context │ Same pattern as list-item in add-to-cart: call from a worklet, scheduleOnRN to pass result to  │
  │                                       │ JS                                                                                             │
  └───────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘

  ---
  Per-day copy (streak-copy.ts)

  Every day 1–100 needs an entry. Milestone days (1, 7, 14, 21, 30, 50, 75, 100) get meaningful messages. In-between days can be short or null
  (nothing shows). Tone: honest acknowledgment, never cheerleader. Xolace voice — close to the fire, not a push notification.

  Examples:
  - Day 1: "You showed up. That's everything."
  - Day 7: "A week. You made a week."
  - Day 14: "Two weeks. It's becoming yours."
  - Day 30: "A month. You stayed."
  - Day 4: "Still here." (or null)
  - Day 9: null (just the flip, no message)

  Export as getStreakCopy(day: number): string | null.

  ---
  Dependencies — all already installed

  - react-native-reanimated — flip animation, spring, measure
  - @shopify/react-native-skia v2.4.18 — blast particles
  - expo-linear-gradient — fold/depth shadows on the flip page
  - react-native-pulsar — Presets.chirp() haptic
  - heroui-native — useThemeColor for CSS var resolution

  ---
  Constraints

  - React Compiler is on — no manual useMemo/useCallback except: functions in useEffect deps, try/finally bodies, Context Provider values
  - Reanimated 4.x — use .get() / .set() not .value
  - No Text from react-native — use AppText from @/src/components/shared/app-text
  - No hardcoded colors — always CSS vars via useThemeColor or className
  - Files under 200 lines — split if needed
  - No new files in top-level hooks/ — colocate everything inside streak-calendar/