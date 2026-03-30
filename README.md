# Xolace

Xolace is an emotional processing app. Not a chatbot. Not a social network. Not therapy.

People open Xolace when they feel something they can't name — heavy, anxious, numb, confused — but not "bad enough" for therapy. The app asks one question: "What's here right now?" The user writes whatever is true (or taps texture words if they can't find words). An AI reads what they expressed and mirrors it back with more precision than they could find themselves — 1-3 sentences that make them think "yes, exactly, that's what I'm feeling." Then they choose: sit with a short guided exercise, see that strangers have felt something similar, or simply close the app knowing they were heard.

### Core Thesis

There is a massive gap between "Everything is fine" (social media performance mode) and "I need therapy" (clinical intervention). Most people live in that gap. Xolace exists in that gap as **emotional processing infrastructure** — the daily layer of mental wellness.

### What It Is NOT

- Not a chatbot (no chat bubbles, no conversation threads, no back-and-forth)
- Not a social app (no feed, no profiles, no followers, no public content)
- Not a wellness app with forced positivity (no gamification, no streak guilt)
- Not clinical (no diagnoses, no therapeutic terminology)
- Not an AI companion/relationship (no parasocial attachment by design)

### The Metaphor

A digital campfire. You sit by the fire alone. The flames help you see what you're carrying. Sometimes you hear quiet voices from others in the darkness — strangers who feel what you feel. The fire is the AI. It illuminates and warms but is not a participant. It's infrastructure.


## Tech Stack

| Category | Tool |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 55) + React Native 0.83 |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, typed routes) |
| UI Components | [HeroUI Native](https://heroui.com/native) |
| Styling | [Uniwind](https://uniwind.dev) (Tailwind CSS v4) + [Tailwind Variants](https://www.tailwind-variants.org/) |
| State | [Zustand](https://zustand.docs.pmnd.rs/) with persist middleware |
| Keyboard | [react-native-keyboard-controller](https://kirurupa.github.io/react-native-keyboard-controller/) |
| Bottom Sheets | [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/) |
| Fonts | Poppins + Inter via `expo-font` |
| Tabs | Native Tabs (`expo-router/unstable-native-tabs`) with web fallback |
| Storage | `expo-sqlite/kv-store` (native) / localStorage (web) |

## Features

- **Multi-theme system** — Base light/dark plus color themes (lavender, mint, sky) with light/dark variants each, all using OKLCH color tokens
- **HeroUI Native components** — Pre-configured provider with toast support and keyboard avoidance
- **Native tab bar** — Platform-native tabs on iOS/Android with SF Symbols and Material icons, web fallback
- **Theme switching** — `useAppTheme()` hook with `setTheme()` and `toggleTheme()` via `Uniwind.setTheme()`
- **Unified storage** — Single adapter for Zustand persistence across native and web
- **Bottom sheets** — `@gorhom/bottom-sheet` with blur backdrop support (`expo-blur`)
- **`cn()` utility** — Tailwind class merging via `clsx` + `tailwind-merge`
- **Custom `AppText`** — Drop-in text component with Poppins font family
- **React Compiler** — Enabled via `reactCompiler: true` experiment
- **Typed routes** — Full type safety for navigation

## Project Structure

```
src/
  app/             Route pages & layouts (theme/ has its own Stack layout)
  components/      UI components (shared/, ui/, icons/, examples/)
  constants/       Theme colors, fonts, spacing, tab config
  context/         React contexts (AppThemeContext for multi-theme)
  providers/       Provider composition (RootProvider)
  hooks/           Custom hooks (color scheme, large header options)
  helpers/         Helper functions & hooks (accessibility, OTA updates, strings)
  lib/             Utilities (cn(), unified storage adapter)
  store/           Zustand store (auth, theme, profile, preferences)
  services/        API & integrations
  themes/          CSS theme files (lavender, mint, sky, alpha)
  interfaces/      TypeScript interfaces by domain
  types/           Type definitions
  global.css       Tailwind/Uniwind/HeroUI Native theme config
```

## Get Started

1. **Clone the repo**

   ```bash
   git clone https://github.com/xolace-official/xolace_app/
   cd xolace_app
   ```

2. **Install dependencies**

   ```bash
   bun install   # or: npm install / yarn / pnpm
   ```

3. **Start the dev server**

   ```bash
   bun expo start
   ```

   From there you can open the app in:
   - [Expo Go](https://expo.dev/go) (default branch)
   - [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [Development build](https://docs.expo.dev/develop/development-builds/introduction/)

4. **Start editing** — Routes live in `src/app/`. The project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Scripts

| Command | Description |
|---|---|
| `bun expo start` | Start the dev server |
| `bun expo start --ios` | Start on iOS simulator |
| `bun expo start --android` | Start on Android emulator |
| `bun expo start --web` | Start on web |
| `bun expo lint` | Run ESLint |
| `bun run reset-project` | Reset to a blank project |

## Learn More

- [Expo docs](https://docs.expo.dev/) — Fundamentals and advanced guides
- [Expo Router docs](https://docs.expo.dev/router/introduction/) — File-based routing
- [HeroUI Native docs](https://v3.heroui.com/docs/native/getting-started) — React Native component library
- [Uniwind docs](https://uniwind.dev) — Tailwind CSS v4 for React Native
- [Zustand docs](https://zustand.docs.pmnd.rs/) — Lightweight state management
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/) — Step-by-step walkthrough

## Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)

## Inspired By ❤️

This starter was built on the shoulders of:

- [HeroUI Native Example](https://github.com/heroui-inc/heroui-native-example) — Reference app for HeroUI Native components and theming patterns
- [Sonny's Expo Starter](https://github.com/Sonnysam/starter-template-expo) — Project structure and developer experience inspiration
- [Expo Default Template](https://docs.expo.dev/) — The official Expo template that serves as the foundation
