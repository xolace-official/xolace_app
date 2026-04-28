# EAS Build Flow

Single source of truth for env vars: **EAS Environment Variables** (`development`, `preview`, `production`).
`eas.json` only carries `APP_VARIANT` per profile. `app.config.ts` reads everything else from `process.env`,
which is populated locally via `eas env:pull`.

---

## One-time setup

1. **Upgrade EAS CLI** (and keep it current):
   ```sh
   bun add -g eas-cli@latest
   eas --version
   ```

2. **Confirm you're logged in to the right account:**
   ```sh
   eas whoami
   ```

3. **Verify required env vars exist in every environment** (`development`, `preview`, `production`):
   ```sh
   eas env:list development
   eas env:list preview
   eas env:list production
   ```

   Required keys per environment:
   - `EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME`
   - `EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID`
   - `EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID`
   - `EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_CONVEX_URL`
   - `EXPO_PUBLIC_CONVEX_SITE_URL`
   - `CLERK_JWT_ISSUER_DOMAIN`
   - `CONVEX_DEPLOYMENT`
   - `POSTHOG_HOST`
   - `POSTHOG_PROJECT_TOKEN`

   Missing keys → add via dashboard or:
   ```sh
   eas env:create --environment <env> --name <KEY> --value <VALUE> --visibility plaintext
   ```

---

## Development build

```sh
# 1. Back up any local .env.local you care about
cp .env.local .env.local.bak 2>/dev/null || true

# 2. Pull the development environment into .env.local (overwrites)
eas env:pull development

# 3. Sanity-check the file looks right
grep -c EXPO_PUBLIC_CLERK_GOOGLE .env.local   # expect 4

# 4. Build
eas build --platform ios     --profile development
# or
eas build --platform android --profile development
```

Bundle ID: `com.xolaceincorg.xolace.dev` · App name: `Xolace (Dev)` · Channel: `development`.

---

## Preview build

```sh
cp .env.local .env.local.bak 2>/dev/null || true

eas env:pull preview

eas build --platform ios     --profile preview
# or
eas build --platform android --profile preview
```

Bundle ID: `com.xolaceincorg.xolace.preview` · App name: `Xolace (Preview)` · Channel: `preview` · auto-increments build number.

---

## Production build

```sh
cp .env.local .env.local.bak 2>/dev/null || true

eas env:pull production

eas build --platform ios     --profile production
# or
eas build --platform android --profile production
```

Bundle ID: `com.xolaceincorg.xolace` · App name: `Xolace` · Channel: `production` · auto-increments build number.

To submit afterward:
```sh
eas submit --platform ios     --profile production --latest
eas submit --platform android --profile production --latest
```

---

## Switching environments locally (no build)

If you want your local Expo Go / dev client pointed at a different environment without rebuilding:

```sh
eas env:pull <environment>   # rewrites .env.local
bun expo start --clear
```

---

## Troubleshooting

**`Missing required environment variable: …` during `eas build`**
→ The required key isn't in that EAS environment. Run `eas env:list <env>` and add it.

**`Missing required environment variable: …` from local `bun expo start`**
→ With the softened `requireEnv`, local runs only warn. If you see the warning, run
`eas env:pull <environment>` to populate `.env.local`.

**`The values from the build profile configuration will be used` warning**
→ Should not appear anymore — `eas.json` no longer defines those keys. If it returns,
something was re-added to a profile's `env` block. Check `eas.json`.

**Wrong bundle ID was built**
→ `APP_VARIANT` in `eas.json` is the only thing that decides bundle ID. Confirm the
right profile was selected. `production` profile must include `"env": { "APP_VARIANT": "production" }`.

**Cache weirdness after switching environments**
→ `bun expo start --clear` to nuke Metro cache.

---

## What never goes in `eas.json`

- OAuth client IDs (public, but kept centralized in EAS env to avoid duplication).
- Anything labeled `EXPO_PUBLIC_*` that varies per environment.
- Any actual secret (`*_TOKEN`, `*_KEY`, issuer domains, deployment URLs).

Only `APP_VARIANT` lives in `eas.json` because it's the switch that picks the bundle
ID before EAS even reads its environment store.
