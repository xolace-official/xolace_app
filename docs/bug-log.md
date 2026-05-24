# Bug Log

A running record of non-obvious bugs we've hit and how we fixed them. Add a new entry at the top whenever a bug took more than ~30 min to diagnose, or whenever the fix involved touching something outside the codebase (cloud consoles, certificates, build infra).

Each entry follows the same shape:

- **Symptom** — what the user/operator saw
- **Where it appeared** — env, build variant, platform
- **Root cause** — the actual underlying issue
- **How we diagnosed it** — the chain of inspection steps that pointed at the cause
- **Fix** — what we changed, where
- **Prevention / future reference** — what to check first if this recurs

Keep entries tight. Link out to commits/PRs/dashboards rather than pasting long logs.

---

## 2026-05-24 — Android Google Sign-In silently fails after account pick (dev + preview + prod)

**Symptom**
- iOS Google Sign-In worked end-to-end (`createdSessionId` set, redirect to protected stack).
- Android: tapping "Continue with Google" opened the Google account picker, user picked an account, then nothing happened. No error toast, no error log. `[GoogleAuth] no session created — createdSessionId: null` warning fired and the user stayed on the auth screen.
- Reproduced on dev, preview, and (potentially) prod builds.

**Where it appeared**
- All three Android variants (`com.xolaceincorg.xolace.dev`, `.preview`, base prod).
- `@clerk/expo` `useSignInWithGoogle()` via the native Credential Manager flow.

**Root cause**
A stack of three independent issues that all manifested with the same symptom (silent `GetCredentialCancellationException` from Android Credential Manager):

1. **Missing Android OAuth client in Google Cloud for the dev/preview/prod package + SHA-1 combos.** For Credential Manager to mint an ID token for the Web Client ID, an Android OAuth client (package + SHA-1) must exist in the **same** Google Cloud project as the Web Client ID. Each build variant has a different package name **and** is signed with a different key, so each needs its own registration.
2. **Local `expo run:android` was building as production**, not dev. `app.config.ts` reads `APP_VARIANT` to pick the package name; without `APP_VARIANT=development` set, the local build installed as `com.xolaceincorg.xolace` instead of `com.xolaceincorg.xolace.dev`. We were registering an OAuth client for `.dev` but the installed APK was prod — perfect mismatch.
3. **EAS preview keystore had been rotated at some point**, so the SHA-1 EAS *displayed* (`8E:FF…`) didn't match the SHA-1 of the actually-installed APK (`BF:90…`). Fixing the EAS default keystore back, then rebuilding, restored the match.

Underlying these: `EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID` is **not** actually read by `@clerk/expo`; only the Web Client ID is. The Android Client ID values just need to *exist* in Google Cloud so the package + SHA-1 lookup succeeds — they're never passed to native code.

**How we diagnosed it**
1. JS-level log showed empty `signIn`/`signUp` objects with no thrown error → meant `signIn.create()` was never called → meant `presentExplicitSignIn` returned a non-success response, but the wrapper swallowed the response type.
2. Bypassed the wrapper by calling the native turbo module directly via `TurboModuleRegistry.get('ClerkGoogleSignIn')` to see the raw `{type, data}` payload (and any thrown `code`/`message`).
3. That surfaced `code: SIGN_IN_CANCELLED` from `androidx.credentials.exceptions.GetCredentialCancellationException` — the canonical "no matching Android OAuth client found" signature.
4. Pulled the installed APK and ran `apksigner verify --print-certs` to get the SHA-1 the device actually presents. Compared against what was registered in Google Cloud + Clerk + EAS — each variant had a different mismatch.

**Fix**
- **Google Cloud Console** (project `30023455189`): one Android OAuth 2.0 client per package, each carrying the SHA-1 of the key actually used to sign that variant's APK. For prod, **two** Android clients: one for the EAS upload key, one for the Play App Signing key (Play re-signs on upload).
- **Clerk Dashboard** → Native applications: one Android entry per package, SHA-256 of every signing key listed under it.
- **Firebase** (`xolace-app` project): added each Android package as a separate app so `google-services.json` contains a `client` block for each (otherwise the Gradle `processGoogleServices` task fails the build).
- **`google-services.json`** (root + `google-services-preview/`): now contains client entries for `.dev`, `.preview`, and base prod packages.
- **`package.json` scripts** (recommended): added `android:dev` / `android:preview` aliases that set `APP_VARIANT` so local `run:android` never silently builds the wrong variant.
- **`AuthScreen.tsx`**: removed the temporary `TurboModuleRegistry` debug shim and `Alert` calls once each variant's flow was confirmed.

**Prevention / future reference**
If a Google sign-in or any signing-cert-bound Google API silently fails on Android, in this order:

1. `adb shell pm list packages | grep <app>` — confirm the installed package matches what you *think* you built.
2. `adb shell pm path <package>` → `adb pull` → `~/Library/Android/sdk/build-tools/<latest>/apksigner verify --print-certs <apk>` — get the SHA-1 the device actually presents. Don't trust `eas credentials` blindly; the installed APK is the source of truth.
3. Cross-check that SHA-1 against:
   - The Android OAuth client(s) in Google Cloud → APIs & Services → Credentials. Must be in the **same project number** as the Web Client ID.
   - The SHA-256 list on the matching Clerk Native Android entry.
4. If installing from Play (even Internal Testing): also register the Play app-signing key SHA-1/256 from Play Console → Test and release → Setup → App integrity → App signing. Play re-signs every install, so the EAS/upload key SHA is not what users' devices present.
5. After any change to Google Cloud, flush cached "not authorized" state on the device:
   ```
   adb shell pm clear <package>
   adb shell pm clear com.google.android.gms
   ```
6. If Credential Manager is throwing `SIGN_IN_CANCELLED` despite a correct SHA-1, the bug is almost always that the Android OAuth client lives in a different Google Cloud project than the Web Client ID. Check the project number in the console URL.

Related files: `src/features/auth/components/screens/AuthScreen.tsx`, `app.config.ts`, `google-services.json`, `google-services-preview/google-services.json`, `eas.json`.
