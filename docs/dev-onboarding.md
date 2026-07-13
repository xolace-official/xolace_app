# Dev Environment Setup

Getting a new machine from `git clone` to a running app with working sign-in.

Most of this is self-serve. The parts that are **not** are called out under
[What the lead (Nat😜) must do for you](#what-the-lead (Nat😜)-must-do-for-you) —
nothing in the repo can give you those, so request them on day one rather than
discovering you're blocked halfway through.

The one non-obvious trap is **Android Google sign-in**, which fails *silently*
(no error, no toast, just a dead button) if your debug keystore's SHA-1 isn't
registered with Google. Step 5 exists entirely to catch that before it wastes
your afternoon. See `bug-log.md` (2026-05-24) for the full autopsy.

---

## 1. Prerequisites

| Tool | Notes |
|---|---|
| **Bun** | Package manager for this repo. Do not use `npm`/`yarn`. |
| **Xcode** | iOS only. Includes the iOS Simulator. |
| **Android Studio** | Android only. Needed for the SDK + an emulator (AVD). |
| **Java 17+** | Comes with Android Studio; needed for Gradle and `keytool`. |
| **Convex account** | Ask the lead (Nat😜) to add you to the project. |

An Android emulator **must have Google Play Services** (pick an AVD image
labelled "Google Play", not plain "AOSP") — Google sign-in uses Credential
Manager, which does not exist on AOSP images. You also need a Google account
added to the emulator (Settings → Accounts).

```bash
git clone <repo> && cd xolace_app
bun install
```

## 2. Secrets you must be given

Four things are gitignored and cannot be recovered from the repo. Ask the
lead (Nat😜) for them and place them exactly here:

| File | What it is |
|---|---|
| `.env.local` | All client + Convex keys (Clerk, Convex, Sentry, RevenueCat, OpenAI, Anthropic). |
| `.env` | PostHog host + project token. |
| `google-services.json` | Firebase config, used by dev **and** production variants. |
| `google-services-preview/google-services.json` | Firebase config for the preview variant. |

Without `google-services.json` the Android build **fails outright** at the
Gradle `processGoogleServices` task — it is not optional, even if you never
touch Firebase.

`.env.local` keys, for reference (values come from the lead (Nat😜)):

```
EXPO_PUBLIC_CONVEX_URL              EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
EXPO_PUBLIC_CONVEX_SITE_URL         EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID
CONVEX_DEPLOYMENT                   EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID
CONVEX_ENV                          EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID
CLERK_JWT_ISSUER_DOMAIN             EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME
EXPO_PUBLIC_SENTRY_DNS              OPENAI_API_KEY / ANTHROPIC_API_KEY
SENTRY_AUTH_TOKEN                   REVENUECAT_{IOS,ANDROID}_{KEY,TEST_KEY}
```

Server-side keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`CLERK_JWT_ISSUER_DOMAIN`, `REVENUECAT_WEBHOOK_AUTH`, …) also have to exist in
the **Convex dashboard** for the deployment you point at — `.env.local` alone
does not feed the backend.

## 3. Always build a **variant**, never plain `run:android`

`app.config.ts` reads `APP_VARIANT` to pick the package name and app name:

| Command | Package | App name |
|---|---|---|
| `bun android:dev` | `com.xolaceincorg.xolace.dev` | Xolace (Dev) |
| `bun android:preview` | `com.xolaceincorg.xolace.preview` | Xolace (Preview) |
| `bun android` ⚠️ | `com.xolaceincorg.xolace` | Xolace |

**`bun android` / `bunx expo run:android` builds the *production* package**,
because `APP_VARIANT` is unset. It installs and launches fine, so nothing looks
wrong — but its package + debug-key combination is not registered with Google,
so sign-in silently does nothing. If your app is called "Xolace" instead of
"Xolace (Dev)", you built the wrong thing.

Use `bun android:dev` / `bun ios:dev`. Same rule for iOS.

## 4. Convex backend

```bash
bunx convex dev     # generates convex/_generated, watches functions
```

You need to be a member of the Convex project, or be pointed at your own dev
deployment. `CONVEX_DEPLOYMENT` in `.env.local` decides which one you talk to.

### Can two devs share one Clerk instance?

Yes. Each Convex deployment independently verifies Clerk JWTs against the
issuer's JWKS (`convex/auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN` from its
*own* env), and Convex never registers itself with Clerk — so any number of dev
deployments can sit behind a single Clerk dev instance. Point them all at the
same issuer domain. This repo has **no Clerk webhook**, so there's no
single-target conflict there either.

The exception is the **RevenueCat webhook** (`/webhooks/revenuecat`), which
targets one deployment URL. Subscription events only reach whichever deployment
is set in the RevenueCat dashboard — so two people can't test purchase webhooks
against their own backends at the same time. Everything else parallelises.

Note that each deployment has its own `users` table, so the same Clerk account
signing into two deployments creates a separate user doc in each. That's fine
and expected.

## 5. Verify your Android signing key (do this before you touch sign-in)

`android/` is gitignored and regenerated by `expo prebuild`, which writes
`android/app/debug.keystore` from the Expo template. That template keystore is
normally **identical for everyone**, so the SHA-1 already registered in Google
Cloud should cover your machine without you doing anything.

"Normally" is doing real work in that sentence. If you build via Android Studio,
or the template changes, or the keystore is regenerated, your SHA-1 diverges —
and Google sign-in then fails with **no error at all**: the account picker opens,
you pick an account, it spins, and nothing happens. Clerk receives
`createdSessionId: null`.

Check yours matches before assuming the app is broken:

```bash
keytool -list -v -keystore android/app/debug.keystore \
  -alias androiddebugkey -storepass android | grep -E "SHA1:|SHA256:"
```

Expected (the registered Expo default):

```
SHA1:   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
SHA256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

**If your SHA-1 differs, stop and send both hashes to the lead (Nat😜)** — they
must register them (see below) before Google sign-in can work for you. You
cannot fix this from the codebase.

To confirm what the *installed* APK actually presents (the source of truth —
don't trust the keystore file alone if you're unsure):

```bash
adb shell pm path com.xolaceincorg.xolace.dev     # get the path
adb pull <path> /tmp/app.apk
$ANDROID_HOME/build-tools/<latest>/apksigner verify --print-certs /tmp/app.apk
```

## 6. Run it

```bash
bun android:dev      # or: bun ios:dev
```

Sign in with Google. If it works, you're done.

---

## What the lead (Nat😜) must do for you

Actions only the project owner can perform. None of these are in the repo.

1. **Send the four gitignored files** from §2 (`.env.local`, `.env`, both
   `google-services.json`) over a secure channel.
2. **Add you to Convex** (project members) and **Clerk** (dashboard access), or
   provision you a personal dev deployment.
3. **Register your Android signing key — only if your SHA-1 from §5 differs
   from the expected one:**
   - **Google Cloud Console** (project `30023455189` — must be the *same*
     project as the Web Client ID, or the lookup silently fails) → APIs &
     Services → Credentials → create an **Android OAuth client** for package
     `com.xolaceincorg.xolace.dev` with the collaborator's **SHA-1**.
   - **Clerk Dashboard** → Native applications → the Android entry for that
     package → add the collaborator's **SHA-256**.
   - **Firebase** (`xolace-app`) → add the SHA-1 to the Android app, then
     re-download `google-services.json` and re-send it.
4. **Apple Developer team invite**, for anyone building iOS on a device.

---

## Troubleshooting

**Google sign-in: picker opens, I pick an account, nothing happens.**
The signature. Credential Manager found no Android OAuth client matching
*package + SHA-1*, so it returned no credential and no exception. In order:
1. Is the app named "Xolace (Dev)"? If it says "Xolace", you built the prod
   package with `bun android` — rebuild with `bun android:dev`.
2. Does your SHA-1 match §5? If not, the lead (Nat😜) must register it.
3. Is a Google account added to the emulator, and does the image have Play
   Services?

**Gradle: `Could not GET … repo.maven.apache.org … No route to host`.**
Network/DNS, not code — Gradle can't reach Maven Central. Check VPN/firewall
and retry.

**Build fails on `processGoogleServices`.** `google-services.json` is missing or
has no client block for the package you're building. See §2.
