# RevenueCat Configuration Guide

_Last updated: 2026-07-02_

This document explains what RevenueCat Entitlements, Products, and Offerings are, then gives the exact names and values to configure in the RC dashboard for Xolace+.

---

## Concepts First

### Entitlements — "What is the user allowed to do?"

An Entitlement is a **feature gate** you define once in RevenueCat. It is platform-agnostic: it doesn't care whether the user bought a monthly iOS subscription or an annual Android subscription. If any active product grants this entitlement, `hasEntitlement()` returns `true`.

Think of it as a permission level, not a product. You check entitlements in your code; you never check product IDs directly.

**You define entitlements in the RC dashboard, then attach products to them.**

### Products — "What exactly did the user buy?"

A Product is the actual SKU — the thing with a price, registered in App Store Connect (iOS) or Google Play Console (Android). Each platform has its own product IDs and must be configured separately in both the store and RC.

A product maps to exactly one entitlement. When the product is active (user paid, subscription not expired), the entitlement is granted.

**Products live in the app store dashboards first, then you reference them in RC.**

### Offerings — "What do you show on the paywall?"

An Offering is what RC sends to your app when you call `Purchases.getOfferings()`. It groups **Packages** (each Package = one Product + its metadata). You display an Offering's packages as the options on your paywall screen.

The power of Offerings: you can create multiple Offerings in RC (e.g., "default", "black_friday", "win_back") and switch between them remotely without an app update. Your code always asks for `offerings.current` — RC decides which one to serve.

**Offerings are configured entirely in RC. Your app code just renders what RC sends.**

---

## What to Configure in RevenueCat

### Step 1 — Create the Entitlement

| Field | Value |
|-------|-------|
| Identifier | `xolace-plus` |
| Display Name | Xolace+ |
| Description | Full Xolace+ access: insights, semantic peer matching |

This is the string your code queries: `hasEntitlement(ctx, { appUserId, entitlementId: "xolace-plus" })`.

---

### Step 2 — Create Products (in App Store Connect + Google Play first)

#### iOS — App Store Connect

Create two Auto-Renewable Subscriptions under your app, in a Subscription Group called **"Xolace+"**:

| Product ID | Duration | Price | Trial | Display Name |
|------------|----------|-------|-------|--------------|
| `com.xolaceincorg.xolace.plus.annual` | 1 year | $49.99 | 7 days | Xolace+ Annual |
| `com.xolaceincorg.xolace.plus.monthly` | 1 month | $9.99 | None | Xolace+ Monthly |

Set annual as the **higher tier** in the subscription group (it should be ranked above monthly so Apple handles upgrade/downgrade correctly).

> **⚠️ Build-variant / bundle-ID gotcha — read this before you lose an afternoon.**
> StoreKit products are scoped to a **bundle ID**. This app ships three variants with *different* bundle IDs (`com.xolaceincorg.xolace.dev` / `.preview` / base — see `app.config.ts`). That means a `.dev` build **cannot fetch products** configured under the production app record — `getOfferings()` returns empty and RC looks "broken" when it isn't. Two valid paths:
>
> 1. **Separate App Store Connect app record + separate RC app for the `.dev` bundle**, with its own products, or
> 2. **Do all sandbox/StoreKit testing on the `preview` or `production` bundle only**, and use a **StoreKit configuration file** (below) for offline paywall UI work on `.dev`.
>
> Recommended: option 2 — don't duplicate products across app records; iterate paywall UI locally with a StoreKit config file and do real purchase testing on `preview`. If this bites during setup, log it in `docs/bug-log.md`.

#### Local paywall testing — StoreKit configuration file (iOS)

For iterating on the **custom paywall UI** without a sandbox account or real store products, add a **StoreKit configuration file** (`.storekit`) to the Xcode scheme. It defines the two products locally so `getOfferings()` resolves in the simulator. This is purely for UI/flow iteration — it does **not** validate real receipts or webhooks. Real purchase + entitlement + webhook validation still happens on a `preview`/sandbox build.

#### Android — Google Play Console

Create two Subscriptions under your app's "Monetize → Subscriptions" section:

| Product ID | Billing Period | Price | Trial | Display Name |
|------------|---------------|-------|-------|--------------|
| `com.xolaceincorg.xolace.plus.annual` | Annual | $49.99 | 7 days (free trial base plan) | Xolace+ Annual |
| `com.xolaceincorg.xolace.plus.monthly` | Monthly | $9.99 | None | Xolace+ Monthly |

On Android, each Subscription has **base plans** and **offers**. Configure:
- Annual base plan: `annual`
- Annual offer (for trial): `annual-trial` — 7-day free trial → then $49.99/yr
- Monthly base plan: `monthly`

#### Add products to RC

In RC dashboard → **Products**, add both product IDs for both platforms and link them to your app.

---

### Step 3 — Attach Products to Entitlement

In RC dashboard → **Entitlements** → `xolace-plus` → **Attach Products**:

Attach all four (iOS annual, iOS monthly, Android annual, Android monthly).

---

### Step 4 — Create the Offering

| Field | Value |
|-------|-------|
| Identifier | `default` |
| Display Name | Default |
| Description | Standard Xolace+ paywall |

Under this Offering, create two **Packages**:

| Package Identifier | Display Name | Product (iOS) | Product (Android) |
|-------------------|-------------|---------------|------------------|
| `$rc_annual` | Annual | `com.xolaceincorg.xolace.plus.annual` | `com.xolaceincorg.xolace.plus.annual` |
| `$rc_monthly` | Monthly | `com.xolaceincorg.xolace.plus.monthly` | `com.xolaceincorg.xolace.plus.monthly` |

`$rc_annual` and `$rc_monthly` are RC's reserved identifiers — using them means RC automatically knows the package type without custom logic.

Set the **default package** to `$rc_annual`.

---

### Step 4b — (Optional) Early-Bird / Founding Offering

For the launch FOMO window (see `confirmed-offers.md` → Early-Bird Pricing), create a **second Offering** rather than editing `default`:

| Field | Value |
|-------|-------|
| Identifier | `founding` |
| Display Name | Founding |
| Description | Time-boxed founding-member pricing |

- Your app always calls `offerings.current`. During the window, set `founding` as **current** in RC (Offering → "Make current"); after it closes, switch back to `default` — **no app update needed**.
- **iOS one-intro-offer rule:** a user is eligible for only *one* introductory offer per subscription. So the founding annual is a fork — pick one:
  - **Discounted first year, no trial** (recommended for the engaged cohort): configure an **Introductory Offer** on `com.xolaceincorg.xolace.plus.annual` = e.g. `$34.99` for the first year (pay-up-front), then renews at $49.99. In this mode the annual has **no** free trial during the window.
  - **Keep the trial**, and run the founding discount on **monthly** or via **Offer Codes** distributed to early users instead.
- Android: model the founding discount as a separate **offer** on the annual base plan (e.g. `annual-founding`) with an eligibility/end date.
- Always show list price struck-through in the paywall UI (RC returns both the intro and the standard price on the package — render both).

---

### Step 5 — Configure Webhook (for `convex-revenuecat` component)

In RC dashboard → **Project Settings** → **Integrations** → **Webhooks** → **+ New**:

| Field | Value |
|-------|-------|
| Name | Convex |
| Webhook URL | `https://<your-convex-deployment>.convex.site/webhooks/revenuecat` |
| Authorization header | A secure random string (generate with `openssl rand -base64 32`) |

Store the authorization string in Convex env:
```bash
bunx convex env set REVENUECAT_WEBHOOK_AUTH "your-generated-secret"
```

---

### Step 6 — API Keys

RC generates separate API keys per platform and environment. You need four:

| Key | Used for |
|-----|----------|
| iOS Production API Key | Production iOS builds |
| iOS Sandbox/Test API Key | Development iOS builds (`__DEV__`) |
| Android Production API Key | Production Android builds |
| Android Test API Key | Development Android builds (`__DEV__`) |

Find these in RC dashboard → **Project Settings** → **API Keys**.

In the app, these go into `app.config.ts` under `extra.revenueCat.*` (not hardcoded, referenced from env).

---

## RC Dashboard Checklist

- [ ] Entitlement `xolace-plus` created
- [ ] iOS subscription group "Xolace+" created in App Store Connect
- [ ] `com.xolaceincorg.xolace.plus.annual` (iOS) created with 7-day trial
- [ ] `com.xolaceincorg.xolace.plus.monthly` (iOS) created
- [ ] Android subscriptions created in Google Play Console with matching product IDs
- [ ] All 4 products added to RC and attached to `xolace-plus` entitlement
- [ ] `default` Offering created with `$rc_annual` and `$rc_monthly` packages
- [ ] (Optional) `founding` Offering created for the early-bird window; intro-offer fork decided (discounted first year *or* trial, not both on iOS)
- [ ] StoreKit configuration file added to Xcode scheme for local paywall UI testing
- [ ] Build-variant/bundle-ID scoping decided (test on `preview`/`prod` bundle, not `.dev`)
- [ ] Grace-period entitlement behavior confirmed (keep `xolace-plus` active during grace)
- [ ] Convex webhook URL configured with auth header
- [ ] `REVENUECAT_WEBHOOK_AUTH` set in Convex env
- [ ] RC API keys added to app config (iOS prod, iOS sandbox, Android prod, Android test)
- [ ] Test webhook sent from RC dashboard and verified in Convex logs

---

## appUserId Convention

The `appUserId` passed to `Purchases.logIn()` must match what `hasEntitlement()` is queried with. Use the user's **`emotionalProfileId`** (`profile._id`) — stable across data wipes (`dataWipe.ts` never deletes the profile row), auth-provider-independent (unlike `tokenIdentifier`, which embeds the Clerk issuer), opaque to RevenueCat, and already the distinctId in PostHog.

```ts
// After auth resolves:
// appUserId comes from api.premium.getEntitlement (= profile._id)
await Purchases.logIn(appUserId);
```

This ties RC's customer record to your Convex user record cleanly.

---

## Entitlement Behavior — decisions to make

### Grace period / billing retry
When a renewal payment fails, Apple/Google enter a **billing grace / retry** window before the subscription actually lapses. RC exposes this state. **Decision:** keep `xolace-plus` **active during grace** (standard, user-friendly) so a transient card failure doesn't yank someone's insights mid-month. RC's `entitlements.active` already reflects grace when configured; the Convex webhook state should mirror it. Don't hard-cut entitlement the instant a renewal fails.

### Trial → entitlement
The entitlement is granted **during** the 7-day trial (the user has full Plus access while trialing). On trial cancellation before day 7, the webhook fires `CANCELLATION` / expiry — entitlement drops at period end, not immediately. Make sure the gated Convex data respects the expiry timestamp, not the cancellation event.

### Client fast-path vs. server truth
- **Server (Convex) is authoritative** for anything that gates *data* — always resolve via the `convex-revenuecat` webhook state, never trust a client claim. This is already the plan.
- **Client may read `customerInfo.entitlements.active`** for *instant UI* (show the unlocked paywall state immediately after purchase) so the UI doesn't stall waiting on a webhook round-trip. Treat it as an optimistic hint, not the source of truth for gated queries.
