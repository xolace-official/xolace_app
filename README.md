# Expo Forge Starter

TypeScript-first Expo + Expo Router + Uniwind + HeroUI Native starter focused on speed, clarity, and good defaults. Ships with multi-theme support, an opinionated project structure, utility helpers, and ready-made screens.

> **Branches:** The `default` branch is Expo Go-compatible. The `main` branch includes additional batteries — auth with Clerk(coming soon), backend with Convex(coming soon), and more.

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
   git clone https://github.com/s-kvng/expo-forge-starter.git
   cd expo-forge-starter
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
