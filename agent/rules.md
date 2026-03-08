# React Native + Expo Engineering Guide

A concise engineering reference for React Native Expo projects. **Copy this README into your project root**—it applies to any app (fintech, e-commerce, social, SaaS, etc.). For Cursor AI: add `.cursor/rules/react-native-expo.mdc` with this content and `alwaysApply: true` to enforce across the project.

---

## 1. Platform Strategy

- Build for **both iOS and Android**
- **iOS-first development** — iOS drives design and interaction decisions
- **Navigation**: **Expo Router** (file-based routing)
  - Route groups: `(auth)` for auth screens, `(dash)/(tabs)` for main app(if tabs apply)
  - Tab config: `constants/tabs.ts` (name, label, SF Symbol `sf` / Material symbol `md` for Native Tabs)
- Use **Expo platform extensions** for platform-specific code ([docs](https://docs.expo.dev/more/glossary-of-terms/#platform-extensions))
- Android supported; iOS sets the design bar

---

## 2. Tech Stack

- **React Native + Expo** only
- **Expo Router** for routing and native tabs
- **Expo SDKs and Expo-compatible libraries** — no custom native code
- **State management**: **Zustand**
- **Path alias**: Always use `@/` (e.g. `@/constants/colors`, `@/components/common/Text`)

### Images

- ✅ Use **`expo-image`** only
- ❌ Never use `Image` from `react-native`

### Text

- ❌ Never import `Text` from `react-native`
- ✅ Use the custom **AppText** component from `@/components/shared/app-text`

---

## 3. Security & Deployment (Fintech-Relevant for All Apps)

- Use **EAS Build** and **OTA Updates** for fast rollouts and security patches. (Should recommend to check fingerprint first before deciding which to go with)
- Keep **code signing** and keys under your control (EAS credentials)
- Avoid blocking the JS thread — keep heavy work off the main thread
- Use **CNG (Continuous Native Generation)** with Prebuild to keep native projects manageable

---

## 4. File & Code Structure

### File Size & Modularity

- **Keep every file under 200 lines** — split if longer
- **Prefer modular code** — extract logic into hooks, utils, services
- One responsibility per file; keep components focused

### Folder Structure

```
app/                 — Expo Router pages & layouts
components/common/   — Layout, typography (MainContainer, Text)
components/shared/   — App-wide shared components ( custom ui components etc.)
components/ui/       — Reusable primitives (Button, Input, Picker)
config/              — App config
constants/           — Colors, fonts, tabs
interfaces/          — TypeScript interfaces by domain
types/               — Type definitions
store/               — Zustand stores
hooks/               — Custom hooks (ui, api, etc.)
helpers/             — Helper functions/hooks (ui, api, etc.)
services/            — API & integrations
utils/               — Pure utilities
lib/                 — Library code 
docs/                — Usage examples (maybe for heroui-native)
```

- Reusable logic **lives outside** UI components
- UI components: layout, composition, minimal state

---

## 5. Styling

- **Uniwind** — utility styling (ensure `global.css` in root `app/_layout.tsx`)
- **StyleSheet** — complex layouts, performance-critical
- Avoid mixing Uniwind and StyleSheet in the same component unnecessarily. And for platform specific styling use `Platform Selectors` from uniwind. (e.g. `ios:text-red-500`)

---

## 6. State Management

- **Zustand** for all app, form, and shared state
- **`useState`** only for trivial local UI (focus, toggles)
- Stores in `store/`, grouped by domain (auth, user, etc.)
- Use Zustand `persist` for state that survives app restarts
- Storage setup at `lib/storage/unified-storage.ts`

---

## 7. TypeScript

- Avoid `any`
- Prefer: interfaces, union types, enums
- **Interfaces**: `interfaces/` by domain
- **Types**: `types/` for props and constants
- Use `@/` path alias for imports

---

## 8. UI & Design System

- **AppText** from `@/components/shared/app-text`
- **MainContainer** from `@/components/common/MainContainer` for screens that it is neccesary for. (e.g. screens that need the scrollView)
- Use semantic variable names: Name variables based on their purpose (e.g., --color-background, --color-primary) rather than their value (e.g., --color-blue-500).
- Avoid hard-coded colors in components: Use CSS variables for colors that should adapt to themes. This ensures your UI remains consistent across theme changes.
- Keep theme variables consistent: Ensure all themes define the same set of variables. If you miss a variable in one theme, we will warn you about it in __DEV__ mode.
- Consistent typography, spacing, and layout across screens
- To add custom font to uniwind see `global.css` and `app.json`.

---

## 9. Backend & Services

- Config in `config/`
- Logic in `services/` — clean, typed, modular
- One concern per file; no direct backend logic in UI
- UI never imports backend clients directly — go through services
- **Supabase** (if used): keep auth and data logic in services; use typed Supabase client
- **Convex** (if used): Follow the official Convex documentation for React Native Expo. (https://docs.convex.dev/quickstarts/react-native)

---

## 10. Code Quality

- No unnecessary comments
- No `console.log` in committed code
- Prefer simple, readable code over clever code
- Keep implementations simple, understandable, robust
- Avoid premature optimization; minimize technical debt

---

## 11. Performance & Maintainability

- Keep components small and focused
- Avoid deep nesting
- Prefer composition over inheritance
- Reuse logic via hooks, utils, services
- Code should be easy to refactor and extend

---

## 12. Build Philosophy

- Ship fast
- Keep the MVP lean
- Design for iteration
- Optimize for maintainability, not perfection

---

*Inspired by [expo-forge-starter](https://github.com/s-kvng/expo-forge-starter) and Expo best practices.*