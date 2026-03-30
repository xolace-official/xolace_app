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

## Architecture

### Provider Hierarchy
The root `_layout.tsx` wraps everything in `RootProvider` > `ThemeProvider` > `AppTabs`. The `RootProvider` (`src/providers/root-provider.tsx`) composes:
1. `GestureHandlerRootView` — gesture support
2. `KeyboardProvider` + `KeyboardAvoidingView` — keyboard handling via `react-native-keyboard-controller`
3. `AppThemeProvider` — multi-theme context (`src/context/app-theme-context.tsx`)
4. `HeroUINativeProvider` — HeroUI Native component library with toast config

### Routing
File-based routing via **Expo Router**. Route files in `src/app/`. Tabs use `expo-router/unstable-native-tabs` (NativeTabs) on native with a web fallback (`app-tabs.web.tsx`). Tab config is data-driven from `src/constants/tabs.ts`. The `theme` tab has its own Stack layout (`src/app/theme/_layout.tsx`).

### Styling & Theming
**Uniwind** (Tailwind CSS v4 for React Native) via `className` props. Configured in `metro.config.js` with `withUniwindConfig`. Types auto-generated to `src/uniwind-types.d.ts`. Use `cn()` from `@/src/lib/utils` to merge classes. Use `tailwind-variants` (`tv()`) for component variant patterns.

**Multi-theme system**: Base light/dark themes defined in `src/global.css`. Additional color themes (lavender, mint, sky) in `src/themes/*.css` with light/dark variants each (e.g., `lavender-light`, `lavender-dark`). Theme switching via `useAppTheme()` hook from `@/src/context/app-theme-context` which calls `Uniwind.setTheme()`. HeroUI Native styles imported in `global.css` via `@import 'heroui-native/styles'` with `@source` pointing to `node_modules/heroui-native/lib`.

### UI Components
**HeroUI Native** is the primary component library. Use `useThemeColor` from `heroui-native` for reading theme color values in JS. Custom SVG icons live in `src/components/icons/`. Bottom sheets use `@gorhom/bottom-sheet` with blur backdrop support (`expo-blur`).

### State Management
**Zustand** with `persist` middleware. Single store at `src/store/store.ts` with slices for auth, theme, profile drafts, and preferences. Persistence uses `src/lib/storage/unified-storage.ts` — localStorage on web, `expo-sqlite/kv-store` on native. Only `theme` and `toggles` are persisted.

### Backend
**Convex** is the backend framework. Convex functions live in `convex/`. Use `useQuery`/`useMutation` from `convex/react` directly in hooks and components — authentication is enforced server-side via `requireAuth()` in `convex/lib/auth.ts`. Always read AGENTS.md for up-to-date function references.

### Path Aliases
`@/src/*` maps to `./src/*` and `@/src/assets/*` maps to `./assets/*` (tsconfig.json).

## Key Conventions

- **Text**: Never import `Text` from `react-native` directly. Use `AppText` from `@/src/components/shared/app-text`.
- **Images**: Use `expo-image` only, never `Image` from `react-native`.
- **Platform-specific code**: Use Expo platform extensions (`.ios.tsx`, `.android.tsx`, `.web.tsx`). For styling, use Uniwind platform selectors (`ios:`, `android:`).
- **Theme colors**: Use CSS variables (e.g., `--background`, `--foreground`, `--accent`, `--surface`, `--overlay`). Never hard-code colors. All themes must define the same set of variables. Use `useThemeColor` from `heroui-native` when you need color values in JS.
- **Fonts**: Poppins family loaded via `expo-font` plugin in `app.json`. Font mapping in `global.css` `@theme` block. Theme CSS files set Inter font family per-variant.
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
app/           — Expo Router pages & layouts (theme/ has its own Stack layout)
components/    — UI components (shared/, ui/, icons/, examples/)
constants/     — Colors, fonts, tabs, theme values
context/       — React contexts (AppThemeContext for multi-theme)
providers/     — Provider composition (RootProvider)
hooks/         — Custom hooks
helpers/       — Helper functions and hooks (utils/, hooks/)
lib/           — Library code (utils.ts, storage/)
store/         — Zustand stores
services/      — API & integrations
themes/        — CSS theme files (lavender, mint, sky, alpha)
interfaces/    — TypeScript interfaces by domain
types/         — Type definitions
```
