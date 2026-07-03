# Xolace+ Premium Gating — Combined Server + Client Plan

## Context

Xolace+ ships as real paid infrastructure (RevenueCat, annual $44.99 w/ 7-day trial hero, monthly $9.99, entitlement `xolace-plus`). Today the codebase has **two duplicate `hasPremium(): false` stubs** (`convex/profile.ts:10`, `convex/avatars.ts:10`), an intent-only `insight_waitlist` flow to delete, and no entitlement/webhook/paywall layer. Goal: one source of truth per side — `convex/lib/premium.ts` (server-authoritative) and `RevenueCatContext` (client purchase + optimistic UI) — that every current and future gate reads.

**Strategy confirmed with user:** RC dashboard + store products are NOT configured yet → **build the full infrastructure now against constants/dev-override**, then swap the two seams' internals when RC config is done. Because both seams are RC-shaped (`hasPremium` mirrors `hasEntitlement`; context mirrors `customerInfo`), the swap touches only `convex/lib/premium.ts` internals + flipping `appConfig.features.payments` — zero gate call sites change. Releases go through the store (no OTA staging); boundaries below are "Convex deploy" vs "store build".

**Codebase findings:**
- `react-native-purchases` + `react-native-purchases-ui` `^10.4.0` already in package.json — installed, zero usage (already in the binary).
- `@convex-dev/rag` `^0.7.5` installed; `convex/rag.ts` already configures the shared instance (OpenAI text-embedding-3-small, `REFLECTION_POOL_NAMESPACE`, filters primaryEmotion/granularLabel/status). Not consumed yet.
- `convex/http.ts` does not exist (net-new).
- Premium theme stubs exist in `src/lib/themes.ts` (`PREMIUM_THEMES`: ember/moss/ink, no CSS); avatar lock UI precedent at `avatar-picker-sheet.tsx:148-179`.
- Waitlist consumers: only `ProfileScreen.tsx` (imports lines 17/22; usage 34, 143-144, 153-154, 169-175).

## Architecture — one combined system

```
                    ┌──────────── SERVER (authoritative for gated data) ────────────┐
RevenueCat ─webhook─▶ convex/http.ts ─▶ convex-revenuecat component (mirrored state)
                                              │ reactive tables + lifecycle hooks
                                              ▼
                    convex/lib/premium.ts  hasPremium(ctx, user)   ← every server gate
                                              ▼
                    gated queries return gate state ─────────────┐
                    └─────────────────────────────────────────────┼──────────────────┘
                    ┌──────────── CLIENT (purchase + instant UI) ─▼──────────────────┐
                    usePlusEntitlement() = api.premium.getEntitlement (server truth)
                                           ∥ RevenueCatContext.isProUser (optimistic)
                                           ∥ appConfig.devIsPlus (payments=false)
                    RevenueCatContext: configure → logIn(emotionalProfileId) → offerings
                                           → purchase()/restore() → PaywallSheet
                    └─────────────────────────────────────────────────────────────────┘
```

Each gated surface ships server + client together: the server query returns the gate state; the client renders lock/blur and routes taps to the paywall. Only `premium.ts` and `RevenueCatContext` know how entitlement is determined.

---

## Step 1 — Install + wire the `convex-revenuecat` component

Exact checklist (from convex.dev component docs + repo):

1. `bun add convex-revenuecat` (pin exact version in package.json; community component — review source on install).
2. `convex/convex.config.ts`:
   ```ts
   import revenuecat from "convex-revenuecat/convex.config";
   app.use(revenuecat);   // alongside rateLimiter, actionCache, migrations, push, workflow, posthog, rag
   ```
3. CREATE `convex/revenuecat.ts` — shared instance (posthog.ts / rag.ts pattern):
   ```ts
   import { RevenueCat } from "convex-revenuecat";
   import { components, internal } from "./_generated/api";

   export const revenuecat = new RevenueCat(components.revenuecat, {
     REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH,
     hooks: {
       onEntitlementActivated: internal.premium.onEntitlementActivated,     // PostHog entitlement_activated
       onEntitlementDeactivated: internal.premium.onEntitlementDeactivated, // PostHog entitlement_expired
     },
   });
   ```
   **appUserId = `emotionalProfileId` (decided — see ID convention, step 10).** The component's `api()` convenience queries derive appUserId from `ctx.auth.getUserIdentity()` (identity fields only, no DB lookup) so they can't resolve the profile id — do NOT re-export them. All entitlement reads go through our own `convex/premium.ts`/`lib/premium.ts`, which pass `appUserId: profile._id` explicitly (`requireAuth` already returns `profile`). Webhook hook payloads carry `appUserId` = emotionalProfileId → direct `ctx.db.get`.
4. CREATE `convex/http.ts` (net-new):
   ```ts
   import { httpRouter } from "convex/server";
   import { revenuecat } from "./revenuecat";
   const http = httpRouter();
   revenuecat.registerRoutes(http);   // mounts POST /webhooks/revenuecat (matches revenuecat-config.md)
   export default http;
   ```
5. Env (user runs — no unprompted deploys): `bunx convex env set REVENUECAT_WEBHOOK_AUTH "$(openssl rand -base64 32)"` — **min 32 chars; missing secret rejects all webhooks with 500**. Same value goes in RC dashboard → Project Settings → Integrations → Webhooks → Authorization header (when dashboard is configured).
6. Hook internalMutations live in `convex/premium.ts` (step 3) — must be **idempotent** (hooks retry).
7. Component handles internally: all 18 RC webhook event types, cancellation-keeps-access-until-expiry, grace periods active, refunds revoke immediately, idempotency. `syncSubscriber` available later to reconcile missed webhooks via RC REST API.

Verification for this step: `bunx convex dev` pushes clean; later, RC dashboard "send test event" → `bunx convex logs` shows event processed; wrong auth header → rejected.

## Step 2 — Server seam: `convex/lib/premium.ts` (CREATE)

```ts
import { Doc } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { revenuecat } from "../revenuecat";

export const PLUS_ENTITLEMENT_ID = "xolace-plus";
export type PremiumTier = "free" | "plus";

export async function hasPremium(ctx: QueryCtx | MutationCtx, profile: Doc<"emotional_profiles">): Promise<boolean> {
  // Phase A (RC unconfigured): env-driven dev switch. Default false = everyone free.
  if (process.env.PREMIUM_DEV_OVERRIDE === "true") return true;
  // Phase B (already wired — live as soon as RC dashboard + webhook configured):
  return await revenuecat.hasEntitlement(ctx, {
    appUserId: profile._id,          // RC appUserId = emotionalProfileId
    entitlementId: PLUS_ENTITLEMENT_ID,
  });
}

export async function getTier(ctx, profile): Promise<{ isPremium: boolean; tier: PremiumTier }>;
export async function requirePremium(ctx, profile, feature: string): Promise<void>; // throws "Xolace+ required: <feature>"
```

- Keyed on `profile._id` (= `emotionalProfileId`) = RC `appUserId`. `requireAuth` (convex/lib/auth.ts) already returns `{ user, profile }` — callers get it free. Verified stable: `dataWipe.ts` resets but never deletes the profile row; created once in `users.ts:49`.
- Both phases coexist: with no RC data the component query returns false, so the dev override is the only switch needed pre-config. Set/unset via `bunx convex env set PREMIUM_DEV_OVERRIDE true`.

## Step 3 — Update callers + entitlement query

- `convex/profile.ts:8-12` — delete local stub, import from `./lib/premium`; `getWeekIntensity` → `premiumRequired: !(await hasPremium(ctx, user))`.
- `convex/avatars.ts:7-12` — delete stub; `setAvatar` (lines 49-51) → `requirePremium(ctx, user, "premium avatar")`.
- CREATE `convex/premium.ts` (camelCase — hyphens break Convex deploy):
  ```ts
  export const getEntitlement = query({ args: {}, handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const isPlus = await hasPremium(ctx, profile);
    // appUserId returned so the client passes the same id to Purchases.logIn()
    return { isPlus, tier: isPlus ? "plus" : "free", appUserId: profile._id };
  }});
  ```
  Reactive — client flips the instant the webhook lands. Also holds the two idempotent hook internalMutations (PostHog captures) from step 1.

## Step 4 — RAG ingestion (Convex deploy)

No vector index on `reflections` (deliberate deviation from setup-doc wording): the RAG component owns embeddings/storage; a table index would duplicate both. CREATE `convex/reflectionsRag.ts`:
- `ingestReflection` internalAction `{ reflectionId }` — load doc, `rag.add(ctx, { namespace: REFLECTION_POOL_NAMESPACE, key: reflectionId, text: displayText, filterValues: [primaryEmotion, granularLabel, status] })`. Keyed on `_id` → idempotent replace.
- Hook the contribute path in `convex/reflections.ts`: `ctx.scheduler.runAfter(0, internal.reflectionsRag.ingestReflection, { reflectionId })` for `status === "active"` rows.
- `backfillPool` internalAction — paginated cursor walk (`take(50)`, self-reschedules). One-shot: `bunx convex run reflectionsRag:backfillPool '{}'` (migrations component can't run actions).

## Step 5 — Semantic matching for Plus (Convex deploy)

`matchForSession` (`convex/reflections.ts:10`) is a reactive query; `rag.search` needs an action → **precompute**:
- Schema: `sessions.semanticMatchIds: v.optional(v.array(v.id("reflections")))`.
- `computeSemanticMatches` internalAction `{ sessionId }` in `reflectionsRag.ts`: `rag.search` on the pool (query = session mirror/summary text, filter `status: "active"`, limit 8) → map keys → intensity ±3 filter → write top 4 via internal mutation.
- Session-completion mutation (`sessions.ts`): if `await hasPremium(ctx, user)`, schedule it.
- `matchForSession`: premium + `semanticMatchIds?.length` → return those docs; else existing tag cascade unchanged (also the graceful fallback if the embed action failed). Free path untouched.

## Step 6 — Drop insight_waitlist (ordered)

> **Removal log (2026-07-03, client half done):** deleted `src/features/profile/hooks/use-insight-waitlist.ts` (pre-billing intent hook: fired `teaser_viewed`/`teaser_tapped`/`waitlist_joined` PostHog events + `joinInsightWaitlist` mutation) and `src/features/profile/components/insight-waitlist-sheet.tsx` ("notify me" bottom sheet). Replaced by `use-insight-gate.ts` → real paywall. Server functions + `insight_waitlist` table intentionally kept until the store release ships (stale-client protection).

1. Client: rewrite `ProfileScreen.tsx` onto `use-paywall` + `PaywallSheet` (step 8); DELETE `use-insight-waitlist.ts` + `insight-waitlist-sheet.tsx`.
2. Server: delete `joinInsightWaitlist` (profile.ts:166), `listInsightWaitlist` (profile.ts:193), `insightFeatureValidator` (lib/validators.ts:107-112).
3. Empty the table (one-shot via `convex/migrations.ts` or dashboard) **before** removing `insight_waitlist` from `schema.ts:1278-1283` — Convex rejects dropping a non-empty table. Since client + server ship together in one store release, keep the backend functions until that release's Convex deploy (deploy backend removal alongside/after the store build going live to avoid stale-client calls — or keep the two mutations as no-ops for one release).

## Step 7 — Client: `RevenueCatContext` + app config

Modeled on the user's reference implementation (appConfig-driven, `__DEV__` test-store key, entitlements array, purchase/restore with haptic+toast feedback), adapted to project conventions (HeroUI toast instead of sonner-native, existing haptics util, AppText, theme tokens, <200-line files).

- CREATE `src/config/app.ts` (pattern-matches `src/config/posthog.ts`):
  ```ts
  export const appConfig = {
    features: { payments: false },     // ← flip true once RC dashboard + store products configured
    monetization: {
      entitlements: ["xolace-plus"],
      revenueCatApiKey:          { ios: extra.revenueCat?.iosKey,     android: extra.revenueCat?.androidKey },
      revenueCatApiKeyTestStore: { ios: extra.revenueCat?.iosTestKey, android: extra.revenueCat?.androidTestKey },
    },
    devIsPlus: false,                  // local free/pro switch while payments=false
  } as const;
  ```
- `app.config.ts`: add `extra.revenueCat.{iosKey,androidKey,iosTestKey,androidTestKey}` from env (Clerk gotcha: expo reads `expoConfig.extra`, must forward in app.config.ts). Keys can be placeholder/empty until RC exists.
- CREATE `src/features/purchases/revenuecat-context.tsx` — same shape as the reference:
  - Context: `{ customerInfo, offerings, isProUser, isLoading, purchase(pkg): Promise<boolean>, restorePurchases(): Promise<boolean> }`.
  - `isProUser = hasActiveEntitlement(customerInfo)` over `appConfig.monetization.entitlements`.
  - `!features.payments` → inert: no `Purchases.configure`; `isProUser = appConfig.devIsPlus`; `isLoading = false`. **This is the constants-only phase — the whole paywall/gating UI is buildable and testable now.**
  - `features.payments` → `Purchases.setLogLevel(VERBOSE)` in `__DEV__`; `Purchases.configure({ apiKey: getApiKey() })` (test-store key in `__DEV__`, prod key otherwise); parallel `getCustomerInfo()` + `getOfferings()`; `addCustomerInfoUpdateListener`.
  - **Addition over the reference:** after Convex auth resolves, `Purchases.logIn(appUserId)` where `appUserId = profile._id` from `api.premium.getEntitlement` — must match the id the server checks entitlements with.
  - `purchase()`/`restorePurchases()` per reference: userCancelled → silent false; success/error haptics + HeroUI toast; PostHog `purchase_started/completed/failed`.
- Mount in `src/providers/root-provider.tsx` **inside** `ConvexClientProvider` (needs authed user for logIn).
- CREATE `src/features/purchases/use-plus-entitlement.ts`:
  ```ts
  export function usePlusEntitlement(): { isPlus: boolean; isLoading: boolean }
  // = useQuery(api.premium.getEntitlement).isPlus (server truth) || context.isProUser (optimistic hint)
  ```
  **All gated UI reads only this hook** — client counterpart of `hasPremium`.

## Step 8 — Paywall hook + sheet

- CREATE `src/features/purchases/use-paywall.ts` (small zustand or context colocated with provider):
  `{ isOpen, surface: PaywallSurface | null, open(surface), close() }`; `PaywallSurface = "insight_teaser" | "week_intensity" | "settings_row" | "premium_theme" | "premium_avatar" | "timeline_extended"`. `open` fires `paywall_opened {surface, session_count}`; `close` fires `paywall_dismissed`.
- CREATE `paywall-sheet.tsx` + `paywall-plan-card.tsx` — modeled on `avatar-picker-sheet.tsx` (HeroUI `BottomSheet` + `BottomSheetBlurOverlay` + `PressableFeedback bg-accent` CTA). Annual hero ($44.99/yr ≈ $3.75/mo, "7-day free trial" badge), monthly secondary, restore link, terms/privacy. Prices from `offerings.current` (`$rc_annual`/`$rc_monthly`) with hardcoded fallbacks while `payments=false`. CTA → context `purchase()`; on success close (server query flips reactively). Copy per confirmed-offers.md (earned-access tone, no "unlock premium"; struck-through list price when the `founding` offering is current). Mount once inside RevenueCatProvider.
- Always-on surfaces: "Xolace+" `SettingsRow variant="nav"` in `SettingsScreen.tsx` ("Active" when Plus); optional quiet Xolace+ row on ProfileScreen near the "your insights" divider.
- Dev-only hidden row may call `RevenueCatUI.presentPaywall()` for RC-side testing; never the shipped path.

## Step 9 — Gate states across features (server + client together)

- **Insight teaser**: extend `getSummary` (or new `getInsightGate`) → `insightState: "forming" | "locked" | "unlocked"` (`sessionCount < 5` → forming; else `hasPremium` ? unlocked : locked) + real word counts. `words-teaser-card.tsx`: replace `PLACEHOLDER_COUNTS` with real values under existing Skia Blur + `gate-fade.tsx` when locked; tap → `open("insight_teaser")`. Forming = current copy + progress toward 5, no paywall. Replace session-count-only logic at `ProfileScreen.tsx:40-55` with server state.
- **Week intensity**: `EarlierWeeksGate` (`week-intensity-card.tsx:99-126`) `onUnlock` → `open("week_intensity")`; `premiumRequired` already flows from `getWeekIntensity`.
- **Themes**: `AppearanceScreen.tsx` renders `FREE_THEMES ∪ PREMIUM_THEMES`; premium rows locked (avatar-lock precedent: 40% opacity + lock.fill) when `!isPlus`; tap → `open("premium_theme")`; `use-appearance-settings.ts setColorTheme` rejects premium when `!isPlus`. Actual ember/moss/ink CSS = separate design task; this wires the lock.
- **Avatars**: `avatar-picker-sheet.tsx` locked tiles: non-selectable → tap opens `open("premium_avatar")`; server already enforces (step 3).
- **Timeline (30-day free window — doc open question #7, recommended value)**: `sessions.listForTimeline` constrains `by_profile_time` to last 30 days when `!hasPremium` + returns `gated` flag; `TimelineScreen`/`use-timeline.ts` render "Unlock your full timeline" footer → `open("timeline_extended")`.
- **Vent cap**: `convex/vent.ts checkAndIncrementCap` picks cap by tier — `ELEVENLABS_DAILY_CAP_MINUTES_PLUS` (e.g. 10) vs existing default 2.
- Deferred: app-icon switching (net-new native module + assets); tiered rate-limiter buckets (suffix keys `:plus` later, no schema change).

## Step 10 — PostHog instrumentation

Client (`usePostHog().capture`):
- `premium_gate_hit {feature, sessionCount, hasData}` on locked-surface tap (+ debounced locked-teaser view)
- `paywall_opened {surface, session_count}` / `paywall_dismissed {surface}`
- `purchase_started|completed|failed {package, surface, errorCode?, userCancelled?}` in context `purchase()`.

Server: `entitlement_activated` / `entitlement_expired` from the component hooks (step 1).

**ID convention (decided): ONE id everywhere — `emotionalProfileId`.**
- RC `appUserId` = `emotionalProfileId` (`Purchases.logIn(profile._id)`; server checks pass `profile._id`). Verified stable across data wipes (`dataWipe.ts` never deletes the profile row); auth-provider-independent (unlike `tokenIdentifier`, which embeds the Clerk issuer and would detach billing on an auth migration); opaque to RevenueCat.
- PostHog `distinctId` = `emotionalProfileId` — already what every server capture uses. RC appUserId ≡ PostHog distinctId → purchase/entitlement funnels stitch with zero aliasing, and RC's native PostHog integration is safe to enable later if desired.
- Webhook hooks: payload `appUserId` is directly `ctx.db.get`-able as the profile id — no lookup indirection.
- **Doc updates needed:** `revenuecat-config.md` (appUserId Convention section) and `xolace-plus-setup.md` (Key Decisions table) currently say tokenIdentifier — update both to emotionalProfileId as part of this branch.

---

## Sequencing / release boundaries (store releases, no OTA)

| Steps | Boundary |
|---|---|
| 1–3 (component + seam + callers) | Convex deploy — can ship immediately, gates all read false |
| 4–6 server halves (RAG, `sessions.semanticMatchIds`, waitlist drop) | Convex deploys |
| 6–10 client (context, paywall, gates, analytics) | **One store build** — RC SDK pods are already in the binary but this release carries all the UI |
| RC dashboard + store products + API keys + webhook secret | Parallel track — when done: set env vars, flip `features.payments: true`, next store build goes live-billing |

Everything is safe to build now: `hasPremium` returns false (or `PREMIUM_DEV_OVERRIDE`), `features.payments=false` keeps the client inert with `devIsPlus` as the local switch.

## Risks

1. Community component on the money path — pin exact version, read source at install. We bypass its `api()` identity-derived queries entirely (appUserId = emotionalProfileId is passed explicitly), so only the webhook ingestion + `hasEntitlement(ctx, {appUserId, entitlementId})` surface matters.
2. Query-vs-action for vector search → precompute; embed failure degrades to tag cascade, never blocks.
3. iOS bundle-id variants: `.dev` builds can't fetch prod StoreKit products (`getOfferings()` empty) — test purchases on `preview` bundle; StoreKit config file + RC test-store keys (`__DEV__`) for simulator paywall iteration (per revenuecat-config.md).
4. Entitlement staleness: webhook lag covered by optimistic client OR; `syncSubscriber` reconciles missed webhooks; restore-purchases in sheet + settings.
5. distinctId split identities (step 10).
6. Waitlist table must be emptied before schema removal.
7. New convex files camelCase (`premium.ts`, `revenuecat.ts`, `reflectionsRag.ts`, `http.ts`).

## Verification

1. After each schema step: `bunx convex dev` (codegen/push to dev), `bunx tsc --noEmit`, `bun expo lint`.
2. Component smoke: after step 1, `bunx convex logs` while sending a test webhook (RC dashboard test event once configured, or `curl -X POST https://<deployment>.convex.site/webhooks/revenuecat -H "Authorization: <secret>" -d '<sample RC event JSON>'`) → event processed; wrong/missing auth → rejected.
3. Backend smoke: `bunx convex run premium:getEntitlement`; `reflectionsRag:backfillPool`; flip `PREMIUM_DEV_OVERRIDE=true` → `getWeekIntensity.premiumRequired` flips reactively.
4. Simulator (Argent) flows, override off: forming (<5 sessions, no paywall) → seed ≥5 → blurred real teaser + CTA opens paywall; settings row, locked theme, locked avatar, timeline footer each open paywall with correct `surface`; `devIsPlus=true` → all client locks open. Override on → server gates unlock; new session completion populates `semanticMatchIds`.
5. After RC config (preview build, `features.payments=true`): sandbox trial purchase → webhook → server flips without restart; cancel mid-sheet → `paywall_dismissed`; restore on reinstall; `Purchases.logIn(emotionalProfileId)` id matches webhook `app_user_id`.
6. PostHog live events: all events with properties; identities merge.



## others if needed

Help me integrate RevenueCat SDK into my Xolace: AI Mood & Feelings app. I need to:

1. Install the RXolaceCat SDK using npm
   - npm: npm install --save react-native-purchases react-native-purchases-ui
   - Documentation: https://www.revenuecat.com/docs/getting-started/installation/reactnative#installation

2. Configure it with my test-store API key (set REVENUECAT_IOS_TEST_KEY / REVENUECAT_ANDROID_TEST_KEY in .env — never commit keys to this doc)

3. Set up basic subscription functionality in React Native

4. Set up entitlement checking for: Xolace: AI Mood & Feelings Pro

5. Handle customer info and purchases

6. Configure products for my app:
- Yearly (yearly)
- Monthly (monthly)

Please provide step-by-step instructions for React Native implementation with bun. Include:
- Complete code examples
- Error handling
- Best practices for subscription management
- Customer info retrieval
- Entitlement checking for Xolace: AI Mood & Feelings Pro
- Present a RevenueCat Paywall (https://www.revenuecat.com/docs/tools/paywalls)
- When it makes sense: Add support for Customer Center (https://www.revenuecat.com/docs/tools/customer-center)
- Product configuration and offering setup
- Make sure to implement it all using the best modern methods supported by the RevenueCat SDK.



Help me install the RevenueCat component.

Package: convex-revenuecat
Install: npm install convex-revenuecat

Documentation:
- https://www.convex.dev/components/ramonclaudio-convex-revenuecat/ramonclaudio-convex-revenuecat.md
- https://www.convex.dev/components/ramonclaudio-convex-revenuecat/llms.txt

Please:
1. Retrieve the install command and documentation
2. Generate an exact setup checklist for this component
3. List any required environment variables
4. Provide verification steps


todo
bunx convex env set REVENUECAT_WEBHOOK_AUTH "$(openssl rand -base64 32)"
Missing secret → all inbound webhooks rejected. The same value goes in the RC dashboard → Integrations → Webhooks → Authorization header once that's configured. (And PREMIUM_DEV_OVERRIDE=true whenever you want to test the unlocked server path.)