# Voice Vent v1 — CEO Plan
**Branch:** `feat/vent-v1`
**Date:** 2026-06-10
**Approach:** Approach B confirmed — expo-audio recorder (metering → waveform animation + audio file) + ElevenLabs Scribe STT server-side + Claude ≤8-word acknowledgement + ElevenLabs TTS playback + destruction animation

---

## 1. What We're Building

A **paper-burning ritual** — not a feature. The user speaks their weight, watches it dissolve, hears 8 words that confirm they were received, sees it gone. No history. No trace. No chat. No follow-up. Just release.

**Core loop:**
```
Enter → Record (waveform alive) → Stop → Dissolution starts
  → [server: Scribe STT → Claude ≤8 words → ElevenLabs TTS]
  → Hear acknowledgement → Gone.
```

The dissolution animation starts **the moment recording stops** — not after server response. The AI audio arrives during or after the visual release. User is not waiting for a spinner.

---

## 2. What We Are NOT Building in v1

- Design/animation system (separate design review with user — they have ideas)
- Waveform vs other visual — TBD in design review
- The full ElevenLabs Conversational AI Agent (v2, when SDK conflict is resolved)
- Any session history / timeline entry for vents (ephemeral by design)
- Peer vent matching or social layer
- Export, keep, or share capability

---

## 3. Architecture Decision: Approach B

| Concern | Approach A (dual stream) | **Approach B (expo-audio only)** |
|---|---|---|
| Waveform animation | ✅ expo-audio metering | ✅ expo-audio metering |
| STT quality | ⚠️ expo-speech-recognition (accent risk) | ✅ ElevenLabs Scribe |
| iOS audio session | ❌ dual AVAudioEngine conflict (untested) | ✅ single session |
| Post-stop latency | ~2-3s | ~4-7s (masked by animation) |
| Architecture clarity | More moving parts | Single recording pipeline |

**Decision:** expo-audio records the session. On stop, the audio file goes to the server. Animation begins immediately. AI response arrives during/after visual.

---

## 4. State Machine

Five states. Driven by `useVentFlow()`.

```
idle → recording → processing → heard → gone
              ↓
          (on error)
            error → idle (auto-reset after 3s)
```

**idle** — "Speak your weight." + visual cue to tap mic button  
**recording** — mic active, expo-audio metering drives visual, stop button visible  
**processing** — recording stopped, animation begins, server call in flight (invisible to user unless > 8s)  
**heard** — AI audio plays, words appear (≤8, very small, below visual)  
**gone** — "Gone." text + final animation beat, auto-dismiss or manual close after 2s  
**error** — silent fallback to idle (no error UX — "Gone." plays anyway if STT fails, just without words)

**Error resilience rule:** If Scribe STT fails, Claude fails, or TTS fails → skip the acknowledgement, play the "Gone." animation anyway. The destruction ritual is not contingent on AI. User still gets the release.

---

## 5. New Files

```
src/app/(protected)/voice-vent.tsx          ← route (thin wrapper, already exists)
src/features/vent/
  components/
    screen/
      vent-screen.tsx                        ← main screen (≤200 lines)
    vent-idle.tsx                            ← idle state visual
    vent-recording.tsx                       ← recording state (metering-driven visual TBD)
    vent-processing.tsx                      ← post-stop animation
    vent-heard.tsx                           ← acknowledgement display
    vent-gone.tsx                            ← "Gone." final state
  hooks/
    use-vent-recorder.ts                     ← expo-audio recorder + metering
    use-vent-flow.ts                         ← state machine + server call orchestration
convex/ai/vent-acknowledge.ts               ← Claude prompt for ≤8-word acknowledgement
```

**Modified files:**
```
convex/vent.ts                              ← add transcribeAndAcknowledge action
src/features/idle-menu/menu-buttons.tsx     ← uncomment Vent menu item
```

---

## 6. Convex Functions to Add

### `convex/vent.ts` — add `transcribeAndAcknowledge`

```typescript
// internalAction
// args: { audioBytes: v.bytes() }
// returns: { words: string, audioUrl: string } | { words: null, audioUrl: null }
//
// 1. POST audio to ElevenLabs Scribe STT
// 2. If transcript ≥ 20 chars → classifyVentSafety check (existing, no-store)
// 3. Pass transcript to Claude via vent-acknowledge prompt → ≤8 words
// 4. Pass words to ElevenLabs TTS (reuse generateMirrorAudio pattern, voice: "witnessed")
// 5. Return { words, audioUrl }
// Transcript is NEVER stored anywhere — only words and audioUrl returned
```

```typescript
// public action: processVentAudio
// args: {}
// Calls checkAndIncrementCap mutation, then transcribeAndAcknowledge with audio bytes
// Returns { words: string | null, audioUrl: string | null }
// Client uploads audio as bytes via this action
```

### `convex/ai/vent-acknowledge.ts` — Claude prompt

```
SYSTEM: You witness someone who just spoke something heavy. 
Your only job: 8 words or fewer. No punctuation. No "I". No advice.
Just the thing they need to hear that says: I caught what you carried.
The words should feel like a warm hand on a shoulder in the dark.

NEGATIVE EXAMPLES — NEVER output these forms:
- "I hear you" (too generic)
- "You're not alone" (cliché)  
- "That sounds really hard" (therapy-speak)
- "Everything will be okay" (false comfort)
- "Thank you for sharing" (formal)
- Any question
- Any advice
- More than 8 words
- Punctuation marks
```

---

## 7. `use-vent-recorder.ts` Pattern

```typescript
// Uses expo-audio:
//   useAudioRecorder({ isMeteringEnabled: true })
//   useAudioRecorderState(recorder, 50)  ← 50ms polling for smooth animation
//
// Exposes:
//   startRecording() → requests mic permission, calls recorder.record()
//   stopRecording() → calls recorder.stop(), returns audio URI
//   metering: number  ← normalized 0-1 from raw dB (-160 to 0 range)
//   isRecording: boolean
//   durationMs: number
//
// Metering normalization:
//   const raw = recorderState.metering ?? -160
//   const normalized = Math.max(0, Math.min(1, (raw + 160) / 160))
//   → 0 = silence, 1 = max volume
//
// Audio file: m4a format (iOS default), kept in-memory URI
// NOT saved to camera roll, NOT persisted
```

---

## 8. `use-vent-flow.ts` Pattern

```typescript
type VentState = 'idle' | 'recording' | 'processing' | 'heard' | 'gone' | 'error'

// Internal flow:
// 1. startVent() → checkAndIncrementCap → if allowed: startRecording + setState('recording')
// 2. stopVent() → stopRecording → setState('processing') → processVentAudio(audioBytes)
// 3. On server response → setState('heard'), store words + audioUrl
// 4. After TTS plays → setState('gone')
// 5. After 'gone' dwell (2s) → auto-dismiss via router.back()
//
// Cap exceeded → show gentle message, no error state
// Any server error → setState('gone') silently (destruction ritual happens regardless)
```

---

## 9. Audio Upload Strategy

expo-audio produces a local URI (e.g., `file:///tmp/recording.m4a`). To send to Convex:

```typescript
// In use-vent-flow.ts, after stopRecording():
const response = await fetch(audioUri)
const blob = await response.blob()
const arrayBuffer = await blob.arrayBuffer()
// Pass as v.bytes() to processVentAudio action
```

Convex `v.bytes()` accepts `ArrayBuffer`. Max size limit is 1MB — a 60s voice memo at typical compression is ~300-500KB. Fine for our use case (typical vent: 20-120s).

---

## 10. Route File

`src/app/(protected)/voice-vent.tsx` — this file already exists as a placeholder. Replace its content with the pattern from other protected screens:

```typescript
// Route file stays thin — just imports and renders VentScreen
// gestureEnabled: false (already set in existing layout? verify)
```

---

## 11. Menu Entry Activation

`src/features/idle-menu/menu-buttons.tsx:31-39` — uncomment the Vent item, add `iconName` property to match the existing item shape:

```typescript
{
  label: "Vent",
  icon: { ios: "mic", android: "mic" },
  iconName: { ios: "mic", android: "mic" },
  accessibilityLabel: "Open voice vent — speak your weight",
  onPress: () => {
    onClose();
    router.push("/(protected)/voice-vent");
  },
},
```

---

## 12. Safety

- `classifyVentSafety` already exists in `convex/vent.ts` with crisis keyword list
- Called server-side on the transcript (never stored) before acknowledgement
- Crisis path: skip acknowledgement, return words: `"you don't have to carry this alone"` (static fallback, not AI), show crisis resources link
- No new schema fields needed — crisis resources screen already exists at `(protected)/crisis-resources`

---

## 13. What's Already Done (Cherry-Picks)

| ID | What | File |
|---|---|---|
| CP1 | Daily cap gate | `convex/vent.ts`: `checkAndIncrementCap` |
| CP2 | Schema fields | `convex/schema.ts`: `ventDailyMinutesUsed`, `ventDailyResetAt`, `kept`, `postSessionMood` |
| CP3 | Safety classifier | `convex/vent.ts`: `classifyVentSafety` |
| CP4 | Screen placeholder + close button | `src/components/extras/voice-vent.tsx` |
| CP5 | Haptics | `src/lib/haptics`: `playSessionComplete`, `playGentlePresence` |
| CP6 | TTS pattern | `convex/ai/tts.ts`: `generateMirrorAudio` + voice map |
| CP7 | Audio player pattern | `src/features/reflect/hooks/use-mirror-audio.ts` |

---

## 14. v1 Scope Boundary

**In v1:**
- Record → Scribe → Claude ≤8 words → TTS → Gone.
- Daily cap (2 sessions, already wired)
- Crisis safety check (no-store, keyword-based)
- Menu entry activated

**Not in v1 (explicit defers):**
- Design/animation system (separate design review)
- ElevenLabs Agent / conversational experience (v2)
- Mood check after vent (schema field exists, not wired)
- Vent timeline / history (deliberately never)
- Haptic sync to waveform (v1.1)

---

## 15. Implementation Order

```
Step 1: convex/ai/vent-acknowledge.ts — Claude prompt + action
Step 2: convex/vent.ts — add transcribeAndAcknowledge + processVentAudio
Step 3: src/features/vent/hooks/use-vent-recorder.ts
Step 4: src/features/vent/hooks/use-vent-flow.ts
Step 5: src/features/vent/components/screen/vent-screen.tsx + state components (placeholder visuals)
Step 6: src/app/(protected)/voice-vent.tsx — replace placeholder with real screen
Step 7: menu-buttons.tsx — uncomment Vent entry
Step 8: Design review → replace placeholder visuals with final animation
```

Steps 1-4 are backend + hooks — no design dependency. Steps 5-7 use placeholder visuals that the design review will replace. This means implementation can start before the design review is complete.

---

## 16. Open Questions for Design Review

1. Waveform vs orb-pulse vs particle system vs something else entirely — user has ideas
2. "Gone." typography — how it appears, how it leaves
3. Mic button design — tap to start / tap to stop vs hold to record
4. Does the acknowledgement text appear at all, or is it audio-only?
5. Transition from idle → recording — does the background shift?
6. Duration limit UX — does the user see a timer? A subtle visual cue?

---

## 17. Env Vars Required

```
ELEVENLABS_VOICE_API_KEY   ← already in production (used by TTS)
ELEVENLABS_SCRIBE_API_KEY  ← may be same key, confirm with 11labs docs
ELEVENLABS_DAILY_CAP_MINUTES  ← already read in vent.ts (default: 2)
```

ElevenLabs Scribe uses the same `xi-api-key` header as TTS — one key covers both. Verify before wiring.
