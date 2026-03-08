# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expo Forge Starter — a TypeScript-first Expo + Expo Router + Uniwind + HeroUI Native starter kit. The `default` branch is Expo Go-compatible; the `main` branch adds auth (Clerk), backend (Convex), and more batteries.

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
**Uniwind** (Tailwind CSS v4 for React Native) via `className` props. Configured in `metro.config.js` with `withUniwindConfig`. Types auto-generated to `src/uniwind-types.d.ts`. Use `cn()` from `@/lib/utils` to merge classes. Use `tailwind-variants` (`tv()`) for component variant patterns.

**Multi-theme system**: Base light/dark themes defined in `src/global.css`. Additional color themes (lavender, mint, sky) in `src/themes/*.css` with light/dark variants each (e.g., `lavender-light`, `lavender-dark`). Theme switching via `useAppTheme()` hook from `@/context/app-theme-context` which calls `Uniwind.setTheme()`. HeroUI Native styles imported in `global.css` via `@import 'heroui-native/styles'` with `@source` pointing to `node_modules/heroui-native/lib`.

### UI Components
**HeroUI Native** is the primary component library. Use `useThemeColor` from `heroui-native` for reading theme color values in JS. Custom SVG icons live in `src/components/icons/`. Bottom sheets use `@gorhom/bottom-sheet` with blur backdrop support (`expo-blur`).

### State Management
**Zustand** with `persist` middleware. Single store at `src/store/store.ts` with slices for auth, theme, profile drafts, and preferences. Persistence uses `src/lib/storage/unified-storage.ts` — localStorage on web, `expo-sqlite/kv-store` on native. Only `theme` and `toggles` are persisted.

### Path Aliases
`@/*` maps to `./src/*` and `@/assets/*` maps to `./assets/*` (tsconfig.json).

## Key Conventions

- **Text**: Never import `Text` from `react-native` directly. Use `AppText` from `@/components/shared/app-text`.
- **Images**: Use `expo-image` only, never `Image` from `react-native`.
- **Platform-specific code**: Use Expo platform extensions (`.ios.tsx`, `.android.tsx`, `.web.tsx`). For styling, use Uniwind platform selectors (`ios:`, `android:`).
- **Theme colors**: Use CSS variables (e.g., `--background`, `--foreground`, `--accent`, `--surface`, `--overlay`). Never hard-code colors. All themes must define the same set of variables. Use `useThemeColor` from `heroui-native` when you need color values in JS.
- **Fonts**: Poppins family loaded via `expo-font` plugin in `app.json`. Font mapping in `global.css` `@theme` block. Theme CSS files set Inter font family per-variant.
- **File size**: Keep files under 200 lines. Extract logic into hooks, utils, services.
- **Imports**: Always use `@/` path alias. Avoid barrel re-exports that pull in unused code.
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
