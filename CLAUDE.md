# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

#### 1. What Xolace Is

Xolace is an emotional processing app/infrastructure. Not a chatbot. Not a social network. Not therapy.

People open Xolace when they feel something they can't name — heavy, anxious, numb, confused — but not "bad enough" for therapy. The app asks one question: "What's here right now?" The user writes whatever is true (or taps texture words if they can't find words). An AI reads what they expressed and mirrors it back with more precision than they could find themselves — 1-3 sentences that make them think "yes, exactly, that's what I'm feeling." Then they choose: sit with a short guided exercise, see that strangers have felt something similar, or simply close the app knowing they were heard.

#### Core Thesis

There is a massive gap between "Everything is fine" (social media performance mode) and "I need therapy" (clinical intervention). Most people live in that gap. Xolace exists in that gap as **emotional processing infrastructure** — the daily layer of mental wellness.

#### What It Is NOT

- Not a chatbot (no chat bubbles, no conversation threads, no back-and-forth)
- Not a social app (no feed, no profiles, no followers, no public content)
- Not a wellness app with forced positivity (no gamification, no streak guilt)
- Not clinical (no diagnoses, no therapeutic terminology)
- Not an AI companion/relationship (no parasocial attachment by design)

#### The Metaphor

A digital campfire. You sit by the fire alone. The flames help you see what you're carrying. Sometimes you hear quiet voices from others in the darkness — strangers who feel what you feel. The fire is the AI. It illuminates and warms but is not a participant. It's infrastructure.

## Commands

- **Install**: `bun install`
- **Start dev server**: `bun expo start` (opens options for iOS sim, Android emulator, web, Expo Go)
- **iOS**: `bun expo start --ios`
- **Android**: `bun expo start --android`
- **Web**: `bun expo start --web`
- **Lint**: `bun expo lint`
- **Install Expo packages**: `npx expo install <package>` (ensures SDK-compatible versions)
- **Dev build (iOS)**: `bunx expo run:ios` (required when adding native modules)
- **EAS build**: `eas build --profile development|preview|production`

## App Flow

The app uses `Stack.Protected` guards in the root layout to conditionally render route groups:

```
!introSeen          → (onboarding)
introSeen && !auth  → (auth)
introSeen && auth   → (protected)
```

### Phase 1: Onboarding
1. **Promise Screen** (`(onboarding)/index`) — Mood marquee carousel + privacy promise. Press "Continue".
2. **Frame Screen** (`(onboarding)/frame`) — Ember orb animation, framework principles revealed in timed phases. Press "That makes sense" → sets `introSeen = true`, replaces to auth.

### Phase 2: Authentication
3. **Auth Screen** (`(auth)/auth`) — Google OAuth via Clerk. On success, calls `getOrCreate()` mutation to sync user with Convex. Auto-routes to protected via guard.

### Phase 3: Core Loop (Reflect → Path → Complete)

The reflect screen (`(protected)/index`) is a **9-state machine** driven by `useReflectionMachine()`:

```
Idle → Typing → Processing → Mirror → Path Selection → Activity → Session End → Idle
                                ↕
                          Clarify (max 2 turns)
                                ↓
                            Gave Up
```

**States in detail:**

- **Idle** — "What's here right now?" + texture word tags (heavy, tight, foggy, buzzing, empty, scattered, numb, raw). Tap to type or select tags to scaffold.
- **Typing** — Freeform text input. 8-second pause detection triggers a gentle nudge ("There's no rush. Let it come."). Submit via "Let it out".
- **Processing** — Server generates AI mirror via Anthropic. Tracks input duration, freeze occurrence, entry type.
- **Mirror** — AI reflection displayed. User chooses: "That's it" (confirm) / "Not quite" or "Say more" (clarify, max 2 turns).
- **Clarify** — Follow-up text input. Server refines mirror. After 2 turns without confirmation → Gave Up.
- **Gave Up** — Empathetic message. "See my options" → path selection, or "Start fresh" → idle.
- **Escalation** — Conditional. Triggers if server flags `escalationTriggered`. User can engage or dismiss.
- **Path Selection** — After mirror confirmed. Three choices:
  - **Solo** → `sit-with-this` screen (breathing/guided exercise placeholder) → session end
  - **Peers** → `peer-reflections` screen (matched anonymous reflections, resonance buttons) → session end
  - **Exit** → session end directly
- **Error** — Retry or reset.

### Session End
- **Exit variant** — "Heard." + link to timeline.
- **Activity variant** (solo/peers) — "You showed up for yourself today." + optional mood check (lighter/same/heavier/unsure) + optional anonymous contribution toggle.
- Both offer "Have more? I'm here." to start a new session.

### Secondary Screens
- **Timeline** (`(protected)/timeline/`) — Past sessions list. Tap a session → session details (`timeline/session/[id]`).
- **Settings** (`(protected)/settings/`) — App preferences.

**Navigation guards**: `sit-with-this`, `peer-reflections`, and `session-end` have `gestureEnabled: false` — user must use button navigation.

## Architecture

### Provider Hierarchy
The root `_layout.tsx` wraps everything in `RootProvider` > `ThemeProvider` > `Stack` (with Protected guards). The `RootProvider` (`src/providers/root-provider.tsx`) composes:
1. `ClerkProvider` + `ConvexProviderWithClerk` — auth + backend
2. `GestureHandlerRootView` — gesture support
3. `KeyboardProvider` + `KeyboardAvoidingView` — keyboard handling via `react-native-keyboard-controller`
4. `AppThemeProvider` — multi-theme context (`src/context/app-theme-context.tsx`)
5. `HeroUINativeProvider` — HeroUI Native component library with toast config

### Routing
File-based routing via **Expo Router**. Route files in `src/app/`. Three route groups with `Stack.Protected` guards: `(onboarding)`, `(auth)`, `(protected)`. Timeline and settings have nested Stack layouts with large headers.

### Styling & Theming
**Uniwind** (Tailwind CSS v4 for React Native) via `className` props. Configured in `metro.config.js` with `withUniwindConfig`. Types auto-generated to `src/uniwind-types.d.ts`. Use `cn()` from `@/src/lib/utils` to merge classes. Use `tailwind-variants` (`tv()`) for component variant patterns.

**Multi-theme system**: Base light/dark themes defined in `src/global.css`. Additional color themes (lavender, mint, sky) in `src/themes/*.css` with light/dark variants each (e.g., `lavender-light`, `lavender-dark`). Theme switching via `useAppTheme()` hook from `@/src/context/app-theme-context` which calls `Uniwind.setTheme()`. HeroUI Native styles imported in `global.css` via `@import 'heroui-native/styles'` with `@source` pointing to `node_modules/heroui-native/lib`.

### UI Components
**HeroUI Native** is the primary component library. Use `useThemeColor` from `heroui-native` for reading theme color values in JS. Custom SVG icons live in `src/components/icons/`. Bottom sheets use `@gorhom/bottom-sheet` with blur backdrop support (`expo-blur`).

### State Management
**Zustand** with `persist` middleware. Single store at `src/store/store.ts` with slices for auth, theme, profile drafts, and preferences. Persistence uses `src/lib/storage/unified-storage.ts` — localStorage on web, `expo-sqlite/kv-store` on native. Only `theme` and `toggles` are persisted.

### Backend
**Convex** is the backend framework. Authentication via **Clerk** (`@clerk/expo` plugin) with JWT validation in `convex/auth.config.ts`. Use `useQuery`/`useMutation` from `convex/react` in hooks and components — authentication is enforced server-side via `requireAuth()` in `convex/lib/auth.ts`. Always read AGENTS.md for up-to-date function references.

#### Convex Directory Structure
```
convex/
  schema.ts          — 9-table schema (privacy-first design)
  auth.config.ts     — Clerk JWT provider config
  lib/auth.ts        — requireAuth(), requireSessionOwnership()
  lib/validators.ts  — Shared validators
  ai/                — AI processing pipeline
    process.ts       — Main processing orchestrator
    safeguard.ts     — Content moderation & escalation detection
    context.ts       — Conversation context assembly
    clarify.ts       — Mirror refinement logic
    providers/       — Anthropic provider, moderation
    prompts/         — articulator, distiller, classifier prompts
  jobs/              — Background jobs
    reflectionAnonymizer.ts, reflectionDistiller.ts
    dataRetention.ts, dataWipe.ts, accountDeletion.ts
    profileStats.ts
  crons.ts           — Scheduled: abandoned sessions, data retention, account deletion
  sessions.ts, sessionTurns.ts, reflections.ts, users.ts, preferences.ts, etc.
```

### Build Variants
`app.config.ts` reads `APP_VARIANT` (development/preview/production) to set bundle identifiers:
- `com.xolaceincorg.xolace.dev` / `com.xolaceincorg.xolace.preview` / `com.xolaceincorg.xolace`
- Each variant has different Google OAuth credentials configured in `eas.json`

### Path Aliases
`@/src/*` maps to `./src/*` and `@/src/assets/*` maps to `./assets/*` (tsconfig.json).

## Key Hooks

- **`useReflectionMachine()`** — 9-state UI machine for the reflect screen. Bridges server state to UI dispatch, tracks typing metrics, exposes action handlers.
- **`useSession()`** — Server session API bridge. Manages `sessionId`, exposes mutations: initiate, submit, confirmMirror, selectPath, startPath, completePath, submitRefinement, abandon, retry.
- **`reflection-reducer.ts`** — Pure state reducer with 11 action types. `MAX_TURNS = 2` for clarifications.
- **`usePathSession()`** — Used by sit-with-this and peer-reflections screens.
- **`useSessionEnd()`** — Session completion + auto-navigate home.

## Key Conventions

- **Text**: Never import `Text` from `react-native` directly. Use `AppText` from `@/src/components/shared/app-text`.
- **Images**: Use `expo-image` only, never `Image` from `react-native`.
- **Platform-specific code**: Use Expo platform extensions (`.ios.tsx`, `.android.tsx`, `.web.tsx`). For styling, use Uniwind platform selectors (`ios:`, `android:`).
- **Theme colors**: Use CSS variables (e.g., `--background`, `--foreground`, `--accent`, `--surface`, `--overlay`). Never hard-code colors. All themes must define the same set of variables. Use `useThemeColor` from `heroui-native` when you need color values in JS.
- **Fonts**: Poppins loaded via `expo-font` plugin. Space Grotesk loaded dynamically via `@expo-google-fonts/space-grotesk` in root layout. Font mapping in `global.css` `@theme` block.
- **File size**: Keep files under 200 lines. Extract logic into hooks, utils, services.
- **Imports**: Always use `@/src/` path alias. Avoid barrel re-exports that pull in unused code.
- **State**: Zustand for shared/form state. `useState` only for trivial local UI.
- **Services**: Backend logic in `src/services/`, never directly in UI components.
- **Adding themes**: Create a new CSS file in `src/themes/`, define `@variant <name>-light` and `@variant <name>-dark` with all required CSS variables, import it in `global.css`, and add the theme names to the `ThemeName` union in `src/context/app-theme-context.tsx`.

## Key Experiments Enabled

- `typedRoutes: true` — type-safe route names
- `reactCompiler: true` — React Compiler enabled

## Folder Structure (src/)

```
app/           — Expo Router pages & layouts
  (onboarding)/ — Intro flow (promise, frame)
  (auth)/       — Authentication (Google OAuth)
  (protected)/  — Core app (reflect, sit-with-this, peer-reflections, session-end, timeline/, settings/)
components/    — UI components (shared/, ui/, icons/, reflect/states/, session-end/)
constants/     — Colors, fonts, tabs, theme values
context/       — React contexts (AppThemeContext for multi-theme)
providers/     — Provider composition (RootProvider)
hooks/         — Custom hooks (reflection machine, session, path, settings, timeline)
helpers/       — Helper functions and hooks (utils/, hooks/)
lib/           — Library code (utils.ts, storage/)
store/         — Zustand stores
services/      — API & integrations
themes/        — CSS theme files (lavender, mint, sky, alpha)
interfaces/    — TypeScript interfaces by domain
types/         — Type definitions
```
