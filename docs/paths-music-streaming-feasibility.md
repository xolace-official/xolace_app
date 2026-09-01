# Paths music feasibility — Spotify / Apple Music / YouTube developer APIs

Wayfinder ticket #271 (child of map #268). Question: is "music" a feasible post-v1 path action type, and via which provider?

**One-line recommendation:** Keep music as a fog (post-v1) item, but **only via Apple Music / MusicKit on iOS** (and possibly YouTube IFrame as a cross-platform fallback with heavy UX constraints). **Drop Spotify** — as of Feb 2026 Spotify caps non-extended apps at 5 users and reserves Web API extended access for "artist and creator discovery" use cases that Xolace is not, so Spotify cannot ship to real users. Music is a **thin, iOS-first, subscriber-only** feature at best; if the roadmap wants a cross-platform, no-subscription-required music action, that does not exist through any first-party API and music should be dropped rather than kept as fog.

---

## 1. Spotify

Primary sources: Spotify Web API reference, Web Playback SDK docs, iOS (App Remote) SDK docs, Developer Policy, Developer Terms, Design guidelines, and the Feb 2026 / Apr 2025 developer-access blog posts.

### 1.1 Playlist create / populate

- Create playlist: `POST /users/{user_id}/playlists` (documented as `POST /me/playlists`), scopes **`playlist-modify-public`** and/or **`playlist-modify-private`** (https://developer.spotify.com/documentation/web-api/reference/create-playlist). The new playlist is empty; you then call **Add Items to Playlist** (`POST /playlists/{playlist_id}/tracks`) to populate it (same page: "The playlist will be empty until you add tracks").
- Technically straightforward — standard OAuth 2.0 Authorization Code + PKCE, JSON REST, no native SDK required for playlist writes.

### 1.2 Playback control

- **Web Playback SDK** — browser-only JavaScript. "The Web Playback SDK requires a Spotify Premium subscription (mobile only types of premium subscriptions are excluded)" and runs "in both mobile (Android and iOS) and Desktop … browsers" (https://developer.spotify.com/documentation/web-playback-sdk). It relies on EME/Widevine in a real browser engine; it is **not usable from a React Native runtime** except inside a WebView, and Spotify does not support/condone that.
- **Spotify iOS SDK / App Remote SDK** — controls a **separately installed Spotify app** running in the background: "offload complexity to the main Spotify application such as: playback, authentication, networking, and offline caching"; "A physical iOS device is needed to install the Spotify app" (https://developer.spotify.com/documentation/ios). Android has an equivalent App Remote SDK. Scope: `app-remote-control`. On-demand track playback through the Spotify app is a **Premium** capability (free tier = shuffle + ads); the iOS SDK page does not restate this — **UNVERIFIED from a single primary page, but consistent with Spotify's published free/Premium model**.
- Remote Web API playback control (`/me/player/*`) also requires Premium (`user-modify-playback-state`) and an already-active Spotify device.

### 1.3 Free-tier viability

- Any programmatic **playback** path requires **Spotify Premium** (Web Playback SDK explicitly; App Remote / Connect effectively). Not viable for free users.
- **Playlist create/populate** does not itself require Premium — a free user can have playlists built on their account. But without Premium the user cannot play that playlist on demand inside Xolace, only in the Spotify app in shuffle mode.

### 1.4 ToS for a mental-health / wellness use case

No explicit health/medical ban, but several Developer Policy clauses cut against Xolace's use (https://developer.spotify.com/policy):

- **Non-commercial / personal use only:** "Spotify is for personal, non-commercial use" and "Do not build products or services … targeted for use by businesses." Xolace is a commercial app with a paid tier (Xolace+).
- **No mixing/overlapping with other audio:** "Do not permit any device or system to segue, mix, re-mix, or overlap any Spotify Content with any other audio content." Xolace plays its own audio tracks / breathing audio — layering or crossfading Spotify under that is prohibited.
- **No synchronization with visuals:** "Do not synchronize any sound recordings with any visual media, including any advertising, film, television program, slideshow, video, or similar content." Playing a track timed to a breathing animation is a plausible violation.
- **No derived metrics / profiling:** "Do not analyze the Spotify Content or the Spotify Service … creating new or derived listenership metrics … building profiles of users." A "path" that reasons over what music helps a user's emotional state is close to this line.
- **No model training:** "Do not use the Spotify Platform or any Spotify Content to train a machine learning or AI model." Xolace's cognition layer must not ingest Spotify data.
- **Attribution / branding (Design guidelines, https://developer.spotify.com/documentation/design):** "If you use any Spotify metadata (including artist, album and track names, album artwork, and audio playback) it must always be accompanied by the Spotify brand"; must show the Spotify logo (min 21px icon), link back to Spotify, use button text like "PLAY ON SPOTIFY" / "LISTEN ON SPOTIFY", and "Don't manipulate any content or metadata."
- Developer Terms add: delete user data "within five (5) days" of disconnect; "will not sell any Spotify Content or other data"; explicit user consent for any use of Spotify Personal Data beyond display.

### 1.5 Auth model, scopes, rate limits, access tier

- OAuth 2.0 Authorization Code + PKCE. Scopes: `playlist-modify-public`, `playlist-modify-private` (playlist writes); `streaming`, `user-read-email`, `user-read-private` (Web Playback SDK); `app-remote-control` (App Remote); `user-modify-playback-state`, `user-read-playback-state` (Connect control).
- **Rate limits:** "calculated based on the number of calls that your app makes to Spotify in a rolling 30 second window"; 429 with `Retry-After`; actual numbers unpublished. Development-mode apps also have separate quota restrictions (https://developer.spotify.com/documentation/web-api/concepts/rate-limits).
- **Access tier is the blocker.** Per the 2026-02-06 update (https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security): "Development Mode will be reduced in scope … for non-commercial use by individual developers", "Each Client ID will be limited to up to five authorized users", one Development Mode Client ID per developer, and "a smaller set of supported endpoints" (new Client IDs from 2026-02-11; existing from 2026-03-09). Per the 2025-04-15 update (https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access): extended access is "reserved for apps with established, scalable, and impactful use cases that help drive our platform strategy forward" and must "promote artists and creator discovery"; over 95% of applications do not qualify. A mental-health app building private mood playlists is **not** an artist-discovery use case.
- Also: since Nov 2024, new apps lost Recommendations, Audio Features, Audio Analysis, Related Artists, Get Featured Playlists (https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api) — so Xolace could not even use Spotify's own audio-mood features to pick tracks.

### 1.6 iOS vs Android

- Web Playback SDK: browser-only both platforms; unusable natively either way.
- App Remote SDK: exists for both iOS and Android; both require the user to have the Spotify app installed and logged in. Community RN/Expo wrapper: **`@wwdrew/expo-spotify-sdk`** (npm, actively maintained as of mid-2026, wraps Spotify iOS SDK v5.x + Android SDK v4.x) and the older, less-maintained `react-native-spotify-remote`. No official Spotify React Native SDK.
- App Store / Play Store: no first-party review guidance found specific to Spotify integration — **UNVERIFIED**.

**Verdict:** **Not viable via Spotify.** Playback needs Premium; the ToS forbids the commercial + audio-mixing + sync-to-visuals shape of a Xolace path; and as of Feb 2026 a new app is capped at 5 users unless it wins "extended access," which is explicitly reserved for artist/creator-discovery products. Spotify cannot ship to Xolace+ users at any real scale.

---

## 2. Apple Music / MusicKit

Primary sources: Apple Music API reference (fetched via `developer.apple.com/tutorials/data/...json`), MusicKit docs, Apple Developer Program License Agreement (ADPLA) PDF, Apple Music Identity Guidelines reference.

### 2.1 Playlist create / populate

- Create library playlist: `POST https://api.music.apple.com/v1/me/library/playlists`, body `LibraryPlaylistCreationRequest` with `attributes.name`, `attributes.description`, and an **optional `relationships.tracks.data[]`** — so a playlist **can be created and populated in one call** (https://developer.apple.com/documentation/applemusicapi/create-a-new-library-playlist). Add later tracks via `POST /v1/me/library/playlists/{id}/tracks` (https://developer.apple.com/documentation/applemusicapi/add-tracks-to-a-library-playlist).
- Requires a **Music User Token** (user must be signed in; library writes require an Apple Music subscription). Response 201; "There may be a delay before a new resource appears in a user's library."

### 2.2 Playback control

- **MusicKit for Swift / iOS:** `ApplicationMusicPlayer` / `SystemMusicPlayer` play full catalog tracks natively. Full playback requires an active Apple Music subscription; check `MusicSubscription.current.canPlayCatalogContent` before enabling play (https://developer.apple.com/documentation/musickit/musicsubscription). Non-subscribers can play the DRM-free 30-second **`PreviewAsset`** directly with `AVFoundation` (AVAudioPlayer/AVQueuePlayer) — no MusicKit player needed.
- **MusicKit for Android:** Apple ships a native Android MusicKit SDK (`com.apple.android.music.playback.*`, `com.apple.android.sdk.authentication`) — sign-in + playback from an Android app (https://developer.apple.com/musickit/android/). Also subscription-gated for full playback.
- **MusicKit JS:** web only; `previewOnly` flag indicates whether full playback is available.

### 2.3 Free-tier viability

- **Full-song playback: no.** Requires an active Apple Music subscription (`canPlayCatalogContent`). Apple provides in-app trial-offer hooks but the user must ultimately subscribe.
- **30-second previews: yes, for anyone** — preview URLs come back in catalog responses and are DRM-free; play with `expo-audio` directly, no MusicKit, no user token, no subscription. This is the only no-subscription music playback path that exists across the three providers.
- **Library playlist writes: no** without a subscription (Music User Token / library requires Apple Music).

### 2.4 ToS for a mental-health / wellness use case

ADPLA §5.2 **D. MusicKit** (verbatim, from the current Apple Developer Program License Agreement PDF, https://developer.apple.com/support/downloads/terms/apple-developer-program/Apple-Developer-Program-License-Agreement-English.pdf):

> "You agree not to call the MusicKit APIs or use MusicKit JS … for purposes unrelated to facilitating access to Your end users' Apple Music subscriptions. If You access the MusicKit APIs or MusicKit JS, then You must follow the Apple Music Identity Guidelines. **You agree not to require payment for or indirectly monetize access to the Apple Music service (e.g. in-app purchase, advertising, requesting user info)** through Your use of the MusicKit APIs, MusicKit JS, or otherwise in any way. In addition:
> - If You choose to offer music playback through the MusicKit APIs or MusicKit JS, **full songs must be enabled for playback, and users must initiate playback and be able to navigate playback using standard media controls** such as 'play,' 'pause,' and 'skip' …;
> - You may not, and You may not permit Your end users to, download, upload, or modify any MusicKit Content and **MusicKit Content cannot be synchronized with any other content**, unless otherwise permitted by Apple in the Documentation;
> - You may play MusicKit Content only as rendered by the MusicKit APIs or MusicKit JS …;
> - Metadata from users (such as playlists and favorites) may be used only to provide a service or function that is clearly disclosed to end users and that is directly relevant to the use of Your Application …"

Implications for Xolace:

- **No explicit health/medical/wellness restriction.** No "high-risk" bar applies — the ADPLA high-risk clause names only nuclear/air-traffic/life-support/weapons (warranty disclaimer, §14), not mental-health apps.
- **"purposes unrelated to facilitating access to Your end users' Apple Music subscriptions"** — a mood/support playlist built on the user's own Apple Music account is arguably within scope, but it is a judgement call. **Flag for legal review.**
- **"indirectly monetize access to the Apple Music service"** — Xolace+ is a paid tier and "paths" (including a music action) are gated behind it. Whether gating a MusicKit feature behind Xolace+ counts as indirectly monetizing access is genuinely unclear. **UNVERIFIED — needs a human/legal check; this is the most likely rejection reason.** Mitigation: make the music action available to all users, not only Xolace+.
- **"MusicKit Content cannot be synchronized with any other content"** — same constraint as Spotify: do not time a track to a breathing animation or layer it under Xolace narration.
- **"full songs must be enabled … users must initiate playback"** — the path can *offer* a track, but Xolace cannot auto-play it; the user taps play, and standard transport controls must be present and honest.
- **Apple Music Identity Guidelines** must be followed (Apple Music badge/attribution, link into Apple Music).

### 2.5 Auth model, scopes, rate limits, entitlements

- **Developer token:** JWT signed **ES256** with a **MusicKit private key** created in Certificates, Identifiers & Profiles; header `kid` = 10-char Key ID; claims `iss` = 10-char Team ID, `iat`, `exp` ≤ `15777000` seconds (**6 months**). Wrong algorithm → 401 (https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens). On Apple platforms, MusicKit generates this automatically once **MusicKit App Service** is enabled on the App ID.
- **Music User Token:** obtained via MusicKit user authorization (`MusicAuthorization.request()` on iOS; `com.apple.android.sdk.authentication` on Android; MusicKit JS `authorize()` on web). Sent as `Music-User-Token` header. Needed for all `/v1/me/library/*` writes.
- **Rate limits:** "Requests using a developer token are rate-limited"; 429 Too Many Requests; "resolves automatically when request rate decreases." **No published numbers** — treat as UNVERIFIED for capacity planning.
- **Entitlements:** enable **MusicKit** in the App ID's App Services; create a media identifier + private key. No separate approval/allow-list process (unlike Spotify extended access).

### 2.6 iOS vs Android

- **iOS:** first-class. Native MusicKit (Swift). RN bridge: **`@lomray/react-native-apple-music`** (npm, new + legacy arch, iOS 15+, auth + transport + `useIsPlaying`/`useCurrentSong` hooks) and its fork `RazaShehryar/react-native-apple-music`. **iOS-only** libraries. Not an official Apple RN SDK. Requires a dev client / bare workflow (Xolace already has this).
- **Android:** Apple's native Android MusicKit SDK exists, but **no maintained React Native wrapper was found** — you would write an Expo module against `com.apple.android.music.playback.*` yourself. Meaningful native effort. **UNVERIFIED whether a usable community RN Android binding exists.**
- **App Store review:** integrating Apple Music via MusicKit is Apple's own sanctioned path; the ADPLA's "must not indirectly monetize" clause is the review risk, not the framework itself. Play Store: no first-party guidance found — **UNVERIFIED**.

**Verdict:** **Viable as a thin, iOS-first, subscriber-only action type**, with caveats: (a) full playback only for Apple Music subscribers; (b) 30-second previews work for everyone via `expo-audio` with no token; (c) the "no indirect monetization" ADPLA clause means the music action probably should not be Xolace+-exclusive — legal check required; (d) Android needs a custom native module. If "music" ships, it ships here first.

---

## 3. YouTube (Data API / IFrame Player API / YouTube Music)

Primary sources: YouTube Data API v3 reference, YouTube API Services Terms of Service, Developer Policies, Required Minimum Functionality (RMF) doc, and the `react-native-youtube-iframe` project.

### 3.1 Playlist create / populate

- Create playlist: `POST https://www.googleapis.com/youtube/v3/playlists`, **quota cost 50 units**, scopes `https://www.googleapis.com/auth/youtube` or `youtube.force-ssl` (https://developers.google.com/youtube/v3/docs/playlists/insert). Creates on the authenticated user's channel.
- Add video: `POST https://www.googleapis.com/youtube/v3/playlistItems`, **quota cost 50 units**, same scopes (https://developers.google.com/youtube/v3/docs/playlistItems/insert).
- So one Xolace "music path" playlist with one track ≈ 100 quota units.
- Developer Policies require **"the user's prior specific and express consent"** before automating "uploads, comments, likes … or other actions" — so playlist creation must be an explicit user-confirmed action, not silent background generation.
- Note: this creates a **YouTube playlist of videos**, not a music library object. There is no public **YouTube Music** API — YouTube Music has no developer surface at all.

### 3.2 Playback control

- **IFrame Player API** — a JavaScript API that controls an `<iframe>`-embedded YouTube player; **web/DOM only** (https://developers.google.com/youtube/iframe_api_reference). No native RN binding exists from Google.
- In React Native this only works through a **WebView**. The maintained community lib is **`react-native-youtube-iframe`** (LonelyCpp) — wraps the IFrame API in `react-native-webview`, works on iOS + Android + Expo, does not depend on the native YouTube app. This is the only realistic RN playback path.
- Playback itself needs no OAuth — just an embeddable video ID (and optionally an API key for metadata).

### 3.3 Free-tier viability

- **Yes — no subscription required.** Anyone can watch embedded YouTube videos for free (with ads). This is the only one of the three providers where programmatic playback works with a free account.
- Data API playlist writes: free, just OAuth + within daily quota.

### 3.4 ToS for a mental-health / wellness use case

YouTube API Services **Developer Policies** (https://developers.google.com/youtube/terms/developer-policies) — verbatim clauses that constrain the Xolace use:

- **No audio isolation / background play:** you must not "separate, isolate, or modify the audio or video components of any YouTube audiovisual content", must not "promote separately the audio or video components", and must not "create, include, or promote features that play content, including audio or video components, from a background player, meaning a player that is not displayed in the page, tab, or screen that the user is viewing." → **The YouTube player must be on-screen and visible while it plays.** A "put on this song and close your eyes / background music during breathing" experience is a direct violation.
- **No player modification:** must not "modify, build upon, or block any portion or functionality of a YouTube player" and must not nest the iframe to circumvent policies.
- **Death/injury clause:** must not "use YouTube API Services for any purpose or activity where the use or failure of those Services could lead to death, personal injury, or environmental damage, such as … life support systems." Standard; a non-clinical support app does not fall under this, but note Xolace should not position music as clinical treatment.
- **Consent for automated actions** (see 3.1).
- **Required Minimum Functionality** (https://developers.google.com/youtube/terms/required-minimum-functionality): embedded players must be ≥ 200×200px, controls must not be obscured by overlays/frames, only one autoplaying player at a time, and "must not make changes to the YouTube player that are not explicitly described by the API documentation."

No wellness/meditation carve-out. No explicit health ban, but the **on-screen-player + no-audio-isolation** rules are what make music-as-ambient-support non-compliant.

### 3.5 Auth model, scopes, rate limits

- **OAuth 2.0** (Google) for writes; scope `youtube` or `youtube.force-ssl`. **API key** for public read / metadata. Google Cloud project with YouTube Data API v3 enabled. Google OAuth verification / security assessment applies for sensitive scopes at scale — **UNVERIFIED how heavy the review is for `youtube.force-ssl`**.
- **Quota:** default **10,000 units/day** shared across endpoints (https://developers.google.com/youtube/v3/getting-started). At ~100 units per created playlist that is ~100 path-playlists/day/project before you must file the **Quota extension request form**. Fine for a pilot, needs an extension at scale.
- No native SDK requirement for the Data API. Playback SDK (IFrame) is JS-only and must run in a WebView on RN.

### 3.6 iOS vs Android

- `react-native-youtube-iframe` works on both iOS and Android via `react-native-webview`, Expo-compatible; behavior is consistent because it deliberately avoids the native YouTube app.
- **App Store review risk:** Apple guideline 4.2 (minimum functionality) and past rejections of "YouTube wrapper" apps are a known pattern — **UNVERIFIED against a current first-party Apple guideline citation**; a music action embedded inside a larger app is lower risk than a standalone wrapper but the background-audio ToS rule still applies.
- Play Store: YouTube ToS enforcement is contractual, not a store-review gate — **UNVERIFIED** for specifics.

**Verdict:** **Technically viable, but ToS-constrained to an on-screen video experience.** YouTube is the only provider that gives free-tier programmatic playback and cross-platform RN support (via WebView). But the Developer Policies forbid background/audio-only playback and require the player to stay visible — so "music" via YouTube can only be a "watch this video" action, not ambient audio behind a breathing exercise. Playlist creation works within a modest daily quota. Acceptable as a **fallback** if a visible-player music action is judged worth building; not a fit for ambient/background music.

---

## Overall verdict

> Covers Spotify / Apple Music / YouTube. **Part 2** (below) surveys every other streaming service with a dev API and the licensable-catalogue route — it does not change the streaming verdicts but adds a self-host recommendation.

| Provider | Playlist create/populate | Programmatic playback | Works without paid subscription | RN / Expo support | ToS fit for a Xolace "path" | Per-provider verdict |
|---|---|---|---|---|---|---|
| **Spotify** | Yes (`playlist-modify-*` scopes) | Premium only (Web Playback SDK browser-only; App Remote controls installed app) | No (playback) | Community `@wwdrew/expo-spotify-sdk`; no official RN SDK | **Poor** — non-commercial-only, no mixing with other audio, no sync-to-visuals, no derived metrics; **and new apps capped at 5 users, extended access reserved for artist-discovery use cases (Feb 2026)** | **Not viable** |
| **Apple Music / MusicKit** | Yes, tracks includable on create (`POST /v1/me/library/playlists`) | Native iOS `ApplicationMusicPlayer` (subscriber only); Android native SDK exists | Full songs: no (Apple Music subscription). 30s previews: **yes, anyone, via `expo-audio`, no token** | `@lomray/react-native-apple-music` (iOS only); Android needs a custom Expo module | **Workable** — no health ban; risks are "purpose unrelated to facilitating the user's subscription" and "no indirect monetization" (Xolace+ gating), plus "no sync with other content" | **Viable, iOS-first, subscriber-gated** (previews for everyone) |
| **YouTube** | Yes (`playlists.insert` + `playlistItems.insert`, 50 units each) | IFrame Player API, **web/DOM only** → RN via WebView (`react-native-youtube-iframe`) | **Yes** (free, ad-supported) | `react-native-youtube-iframe` — iOS + Android + Expo | **Constrained** — player must stay visible on screen; no background/audio-only playback; no audio isolation; automated playlist writes need explicit user consent; no health carve-out | **Viable only as a visible-video action**, not ambient music |

**Fog keep/drop call:** **Keep music as fog, narrowly.** There is no first-party API that delivers the ideal shape — cross-platform, free-tier, ambient/background audio recommended by a "path." Every provider either requires a paid subscription for real playback (Spotify, Apple Music), forbids the background/mixed-audio use (YouTube, and also Spotify/Apple via their no-sync clauses), or won't grant a mental-health app production access (Spotify). What *is* buildable post-v1:

1. **Apple Music / MusicKit, iOS first** — offer a track or a generated library playlist; full playback for Apple Music subscribers, 30-second previews for everyone (previews need no token and play through the existing `expo-audio` stack). Pending a legal read on whether gating behind Xolace+ trips the ADPLA "indirect monetization" clause — de-risk by not making it Xolace+-exclusive.
2. **YouTube** as a cross-platform fallback, but only as an explicit "watch this" video card with a visible player — not ambient audio.

If the product intent for "music" is specifically *ambient/background audio during a support action*, **no provider allows it** and music should be **dropped**, with Xolace's own licensed `expo-audio` tracks (the existing "audio tracks" action type) covering that need instead.

### Flagged as UNVERIFIED — needs a human check

- Spotify App Remote SDK behaviour for non-Premium users (shuffle/ads only) — inferred from Spotify's general free-tier model, not restated on the iOS SDK page.
- Whether a mental-health support playlist qualifies as "facilitating access to the user's Apple Music subscription" under ADPLA §5.2(D), and whether Xolace+ gating counts as "indirectly monetize access to the Apple Music service." **Highest-risk open question for the Apple path — get legal sign-off before building.**
- Exact numeric rate limits for Spotify Web API and Apple Music API (neither publishes numbers).
- Existence of a maintained React Native binding for Apple's **Android** MusicKit SDK (none found).
- Google OAuth verification / security-assessment burden for `youtube.force-ssl` at production scale.
- App Store review posture for an embedded YouTube player inside a larger app (Apple guideline 4.2 / 5.2.3) — no current first-party citation obtained.


---

# Part 2 — other streaming services & licensable catalogs

Second pass on ticket #271: every *other* music service with a third-party developer API, plus the royalty-free self-host route. **Bottom line: the Part 1 call holds for streaming** (Apple Music and YouTube remain the only viable streaming shapes) — but this pass adds a non-streaming option worth the roadmap: self-host a small licensed ambient catalogue next to the ElevenLabs `paths` tracks.

**One-line recommendation:** No other streaming provider beats the Apple Music / YouTube options — every full-catalog API is closed/partner-only, non-commercial-only, or preview-only for third parties — but the **royalty-free self-host route does change the picture**: Xolace can license a small ambient/wellness catalog (Pixabay Music at zero cost, or a paid library like Epidemic Sound / Uppbeat / Soundstripe with indemnity) and serve the audio from Convex storage exactly like the ElevenLabs `paths` tracks, with no streaming API, no subscriber-gating, and identical iOS/Android behaviour.

---

## Deezer

- **API open?** No. The Deezer Developer Portal currently blocks new app creation ("We're not accepting new application creation at this time" — reported widely; the portal itself gates this behind login so treat the exact wording as UNVERIFIED, but the docs and terms are live at <https://developers.deezer.com/api> and <https://developers.deezer.com/termsofuse>).
- **Playlist create/populate?** The API historically supports playlist add via the `manage_library` permission, but moot given registration is closed.
- **Playback?** Non-subscribers get 30 s previews only: "only users registered with a Premium+ account on the Site can access and listen to the full length recordings … which are otherwise accessible only up to 30 seconds" (<https://developers.deezer.com/termsofuse> §II). The old native "Deezer SDK" for iOS/Android was deprecated years ago; no current first-party RN playback SDK.
- **ToS fit?** Fatal for Xolace: "the use of the Services is strictly limited for a non-commercial purpose and in a non-commercial environment" and the developer "shall not perceive, receive, generate, benefit … any moneys, incomes, revenues" (<https://developers.deezer.com/termsofuse> §IV). A paid mental-health app is squarely commercial.

**Verdict:** Not viable (API closed + non-commercial-only).

## Amazon Music

- **API open?** No. "These Amazon Music APIs are currently in a closed Beta" and access "is limited to already approved developers"; you must "contact your Amazon Business Development representative" (<https://developer.amazon.com/docs/music/get_started_program-overview.html>, <https://developer.amazon.com/docs/music/API_web_overview.html>).
- **Playlist create/populate?** The Web API User/Library endpoints exist (<https://developer.amazon.com/docs/music/API_web_library.html>) but only for approved partners.
- **Playback?** "The Amazon Music Web API now provides full audio playback capabilities for users of all subscription tiers: Free, Prime, and Unlimited" (<https://developer.amazon.com/docs/music/API_web_player.html>) — but it is a **web** player API; "we currently don't have a public SDK" (program overview). Auth is Login With Amazon / OAuth 2.0 (<https://developer.amazon.com/docs/music/API_web_LWA.html>). Alexa Music Skill API (<https://developer.amazon.com/en-US/docs/alexa/music-skills/understand-the-music-skill-api.html>) is for Alexa devices, not embeddable in a mobile app.
- **ToS fit?** Not assessable — partner agreement is private.

**Verdict:** API closed (partner-only, no public SDK).

## TIDAL

- **API open?** Partly. The Developer Platform (<https://developer.tidal.com>) has self-serve client registration for the **catalog/metadata + playlist** APIs (JSON:API at `openapi.tidal.com/v2`, OAuth 2.0 Auth Code + PKCE / Client Credentials — <https://github.com/tidal-music/tidal-sdk>). Submitting a *third-party consumer playback app* still requires TIDAL approval (<https://github.com/orgs/tidal-music/discussions/179>).
- **Playlist create/populate?** Yes, on the roadmap/available via the playlists API and user collections (<https://github.com/orgs/tidal-music/discussions/6>).
- **Playback?** Preview-only for third parties. "Audio bytes flow exclusively through the official TIDAL Player SDK; the Playback API only issues signed manifests" and "third-party applications can only include playback of TIDAL previews, not full tracks" — the 30 s cap applies **even when authenticating with a paid TIDAL HiFi account** (<https://github.com/orgs/tidal-music/discussions/214>, <https://github.com/orgs/tidal-music/discussions/40>). Player SDKs exist for Web/iOS/Android. Full-length playback was "targeted for later 2024" with no confirmed GA as of this research — UNVERIFIED, needs a human check against <https://developer.tidal.com/documentation> (SPA, not machine-readable).
- **ToS fit?** Not fully assessable; the platform is consumer-integration oriented. No health-specific clause surfaced.

**Verdict:** Not viable today (playback is preview-only for third parties — same ceiling as the ruled-out Spotify path, worse install base than Apple Music).

## SoundCloud

- **API open?** Barely. "You need a SoundCloud Artist Pro subscription to register API applications and receive credentials," then submit an app form and accept the API Terms (<https://developers.soundcloud.com/docs/api/register-app>). Multi-year GitHub issue threads report registration being closed/unresponsive for long stretches (<https://github.com/soundcloud/api/issues/219>, `/issues/251`) — treat "open" as fragile / UNVERIFIED month to month.
- **Playlist create/populate?** Yes — playlists ("sets") are creatable/editable via the API for authenticated users (<https://developers.soundcloud.com/docs/api/guide>).
- **Playback?** Full-track streaming via the HLS/`stream_url` endpoint (OAuth-signed, short-lived) or the JS/iframe widget; no modern first-party native RN SDK. Playback is subject to per-track monetisation/geo rules.
- **ToS fit?** "SoundCloud API Terms of Use" plus usage policies (<https://help.soundcloud.com/hc/en-us/articles/115003446727>) — no explicit health/medical bar found, but the widget is restricted from "commercial use, distribution or exploitation" without a partnership (mirrors Last.fm). Commercial embedding at Xolace's scale would likely need SoundCloud sign-off.
- **Catalog is UGC** — quality and licensing per track are inconsistent, a poor fit for a curated "support action."

**Verdict:** Not viable (Artist Pro paywall to even get a key, unreliable approvals, commercial-widget restriction, UGC catalog).

## Boomplay (Africa)

- **API open?** No public/self-serve developer API or partner-program documentation exists on any Boomplay first-party property. Third-party aggregators (MusicAPI, Musicfetch) scrape/proxy it; that is not a licensed route. The only Boomplay "SDK" reference is the IAB Open Measurement (OM) ad-viewability SDK, unrelated to playback.
- Everything else (playlist, playback, ToS): **UNVERIFIED — needs a human check** via direct BD contact with Boomplay/Transsion.

**Verdict:** Not viable (no discoverable developer API).

## Audiomack (Africa-strong)

- **API open?** Yes, apparently self-serve. The Data API (<https://audiomack.com/data-api/docs>) uses OAuth 1.0a and exposes `POST /v1/user/register` to create an account + obtain tokens. This is the one provider on the list with a genuinely open, no-paywall developer path.
- **Playlist create/populate?** Yes — `POST /v1/playlist`, `PUT /v1/playlist/:id`, add/remove tracks, on the authenticated user's account.
- **Playback?** Yes — endpoints return a `streaming_url` (an MP3 path, valid ~10 s, re-request just before play) and a `/v1/music/:id/play` play endpoint. No first-party native RN SDK — you would drive it with the app's existing `expo-audio` player. Works iOS + Android (plain HTTPS MP3). No subscription required for playback in principle (Audiomack's consumer model is ad-supported free).
- **ToS fit?** The public API docs contain **no** commercial-use, health/medical, or sync-to-visuals clauses (<https://audiomack.com/data-api/docs>). Silence is not permission — commercial embedding in a paid mental-health app should be confirmed with Audiomack. UNVERIFIED — needs a human check (email Audiomack developer/BD, and read the API Terms of Use accepted at registration).
- Catalog skews hip-hop/afrobeats/reggae/electronic and is partly UGC — decent for an Africa-audience "music" card, thin for ambient/calming material.

**Verdict:** Viable — narrow shape only: an optional "African catalog" music card, self-registered OAuth app, playback through `expo-audio` on short-lived MP3 URLs, pending a written commercial-use OK. Does not beat Apple Music for the general user base.

## Anghami (MENA)

- **API open?** No. The official surface is the "Anghami + OSN+ SDK" (<https://docs.sdk.anghami.com/>, <https://docs.sdk.anghami.com/developer-portal>), proto-first with generated clients (Go/TS/Swift/Java/Python). But: "The portal URL above is a placeholder while we build out the public developer onboarding flow" — until then "contact your Anghami partnership lead for API access." So it is partner-gated in practice.
- **Playlist / playback / subscription:** SDK advertises browse + stream of the full catalog and reading user library/history, with "Entitlements live outside the SDK" (i.e. a paid Anghami plan gates full playback). Native SDK availability for RN specifically is **UNVERIFIED**.
- **ToS fit?** Partner agreement not public — not assessable.

**Verdict:** API closed (partner-only placeholder).

## JioSaavn / Gaana (India)

- **JioSaavn:** No official public API. Only reverse-engineered/unofficial wrappers exist (<https://github.com/cyberboysumanjay/JioSaavnAPI>) — not a licensed route. **Verdict: Not viable.**
- **Gaana:** Historically opened a developer platform (Meta Data / User Data / Player APIs, app-concept review to get a key — MediaNama 2014). No current first-party developer portal is reachable/documented in 2025–26; ownership churn (Times Internet → distressed) makes it **UNVERIFIED — needs a human check**. **Verdict: Not viable / unverifiable.**

## Napster / Rhapsody

- Historically the most permissive full-playback API (the old Rhapsody/Napster "member" API with a native SDK). **Discontinued.** Napster was sold to Infinite Reality on 25 Mar 2025 (<https://en.wikipedia.org/wiki/Napster_(streaming_service)>) and pivoted away from a developer platform; the developer portal and API sign-up are gone. No first-party developer docs resolve.

**Verdict:** API closed (discontinued).

## Qobuz

- **API open?** No. "You need to have a Developer agreement signed with Qobuz … there is no publicly open way to get access." Request an `app_id` by emailing api@qobuz.com; a partner "Apps & UX Guidelines" PDF exists (<https://static.qobuz.com/apps/api/Qobuz-AppsGuidelines-V1.0.pdf>). Community API docs are unofficial (<https://github.com/csngoh/api-documentation>).
- Playback requires a Qobuz subscription; no first-party RN SDK. High-fidelity/audiophile catalog, small user base, premium price — wrong audience shape for Xolace anyway.

**Verdict:** API closed (partner-only, NDA).

## Yandex Music

- **API open?** No official API at all. "There is no official developer documentation from Yandex for their Music API"; everything is reverse-engineered (<https://yandex-music.readthedocs.io/>). Also RU-centric with sanctions/geo exposure.

**Verdict:** Not viable (no official API).

## Pandora

- **API open?** No. "Pandora does not have a public API … generally do not make Pandora available through other sites and applications." There is a partner-only developer portal reached via a partnership request form (<https://developer.pandora.com/docs/overview/partner-access/>). US/AU/NZ only.

**Verdict:** API closed (partner-only).

## Last.fm

- **API open?** Yes for metadata, self-serve key (<https://www.last.fm/api/account/create>). **No playback** — Last.fm has not streamed audio since ~2014; the API is artist/album/track metadata, tags, similar-artists, scrobbling, and search.
- **Commercial use:** "free for non-commercial use; commercial use requires a separate agreement via partners@last.fm," and the widget is "not provided for commercial use, distribution or exploitation" (<https://www.last.fm/api/tos>, <https://www.last.fm/legal/terms>).
- **Useful for track selection?** Marginally. `track.getSimilar` / `tag.getTopTracks` (e.g. tag `calm`, `ambient`, `sleep`) could help *rank or pick* which owned/licensed track to surface for a session — but MusicBrainz (CC0) or the licensable catalog's own semantic search (Epidemic Sound Soundmatch, below) do this without a commercial-use negotiation.

**Verdict:** Metadata only (no playback; commercial metadata use needs a Last.fm agreement).

## 7digital (B2B, now "MassiveMusic")

- **API open?** Partner/commercial only. The classic REST API (v1.2) covers catalogue/search/charts/lookup; "To use the streaming endpoints, you need to arrange access to them with 7digital as they aren't included in the free API" (<https://docs.7digital.com/>, <https://7digital.gitbook.io/api-doc>). Streaming links are OAuth-signed, single-use, 60-min TTL.
- This is a licensed full-catalog B2B route (powers Canva, Soundtrack Your Brand, etc.) — real, but a **commercial licensing deal + per-stream royalty reporting**, i.e. major-label economics. Overkill and expensive for one post-v1 "action type."

**Verdict:** API closed to self-serve (commercial deal + label royalties required).

---

## Royalty-free / licensable catalogs

This is the most useful outcome. Xolace already self-hosts generated audio (ElevenLabs `paths` tracks) in Convex storage and plays it with `expo-audio`. A curated ambient/wellness music catalog can be delivered the **exact same way** — download once, store in Convex, stream to the client — which sidesteps every streaming-API ToS, every subscriber gate, every "playback SDK only" restriction, and every iOS-vs-Android difference. No music API is needed at all.

### Pixabay Music — zero cost

- **Licensing model:** Pixabay Content License. Verbatim grant: "irrevocable, worldwide, perpetual …, non-exclusive and royalty-free right to download, use, copy, modify or adapt the Content for commercial or non-commercial purposes" and this "includes the right to redistribute the Content under the Content License … via an API" (<https://pixabay.com/service/terms/>). No attribution required.
- **Cost:** Free.
- **Self-host?** Yes — that is the intended model. The Pixabay API docs (images/video) already require "download them to your server first" and prohibit permanent hotlinking (<https://pixabay.com/api/docs/>). Note: **Pixabay has no public *music* API** — music/SFX have no API section — so the workflow is manual curation + upload, not a programmatic pull. Fine for a hand-picked wellness set.
- **ToS caveats to check with a human/legal:**
  1. "Standalone" clause — you "cannot sell or distribute Content on a Standalone basis … where no creative effort has been applied." Serving a track as one action inside a paid app (with UI, session context, curation) is incorporation, not standalone resale — reasonable read, but confirm.
  2. Health/medical clause — cannot use Content that depicts a person "as suffering from, or medicating for, a physical or mental ailment" for commercial purposes. This targets *photos/video of people*; instrumental ambient tracks don't trigger it. Pick instrumental/no-vocal tracks and it's a non-issue.
- **Quality:** Mixed (it's a free pool), but there is plenty of usable ambient/piano/lo-fi. Curation effort is the cost.

**Verdict:** Viable — best zero-cost self-host option; needs a one-time legal read of the "standalone" clause and hand-curation.

### Epidemic Sound (Connect / Partner Content API)

- **Licensing model:** Epidemic owns 100% of its catalog rights and sublicenses through the API "without additional clearance requirements"; music is "cleared for personal and commercial use across platforms" (<https://www.epidemicsound.com/business/developers/>, <https://developers.epidemicsound.com/docs/>).
- **API:** Real and modern — full catalog, HLS streaming previews, plus AI tools (Soundmatch video-to-music, semantic search, similar-section, beat detection). **Requires a partnership agreement** before you get Developer Portal credentials (partners include Squarespace, Unfold, Technogym).
- **Self-host?** Model is API-delivered streaming under an active agreement, not "download and keep forever." Offline/permanent caching would be a contract point.
- **Cost:** Custom B2B pricing (not published) — realistically the priciest option here, aimed at platforms embedding music licensing for *their* creators.

**Verdict:** Viable — shape: paid partner API with guaranteed indemnity and good semantic-selection tooling; likely too heavy/expensive for one post-v1 action type, revisit only if "music" becomes a headline feature.

### Uppbeat

- **Licensing model:** Subscription (Free / Essentials / Creator / Pro / Business & Team licenses). "Permitted Media includes online games or applications" (<https://uppbeat.io/user-agreement>), so in-app use is contemplated. But: "You may not … download and stockpile Content for future use outside of the subscription period" and downloads "must be synchronised, integrated with, or applied to … your Permitted Material" — i.e. no building a standalone music-player feature out of it, and hosting rights lapse if you stop paying.
- **API:** No developer API / programmatic catalog found on any first-party page. Manual download only.
- **Cost:** Subscription tiers (Business/Team for multi-seat commercial).

**Verdict:** Viable with friction — usable as a self-hosted curated set *while subscribed*, but the "no stockpiling / sync-only" terms and absence of an API make it worse than Pixabay (free, perpetual) for this use. Confirm the Business license permits streaming tracks to end users as an app feature — UNVERIFIED.

### Jamendo (API route)

- **API:** Self-serve dev portal, returns full-track audio URLs, ~35k requests/month free tier (<https://developer.jamendo.com/v3.0>).
- **Licensing model:** All tracks are Creative Commons. "The API may be used freely for non-commercial uses. For any other type of use including but not limited to commercial uses" you must buy a license — "Commercial use shall be understood as any use that is intended for or directed toward commercial advantage or any monetary compensation" (<https://devportal.jamendo.com/api_terms_of_use>). Also: "Applications must not be specifically designed to cache the content nor offering … offline access," and you must credit each track + backlink to its Jamendo page.
- Commercial route = Jamendo Licensing per-track sync licenses, from **€29/track ("Online" use)** up to ~€1,189/track (<https://licensing.jamendo.com/en/pricing>). A curated set of ~20 tracks ≈ €580 one-off at the low tier — cheap, perpetual, and it does sidestep the streaming-ToS problem, but you're paying per track and the API's own caching ban means you'd license + download outside the API, not stream it.

**Verdict:** Viable via paid per-track sync licenses (not via the free API, which is non-commercial-only and bans caching). Comparable end state to Pixabay but with a real (small) cost and attribution obligation.

### Others (quick)

- **Free Music Archive / Tribe of Noise:** API was shut down ("due to the heavy load … they had to shut down the API"); site allows app developers for direct web access but no API (<https://freemusicarchive.org/app-developers>). Catalog is CC (attribution/NC varies per track). **Verdict: Metadata/manual only, no API.**
- **Bandcamp:** Public content API discontinued, "not granting any new developer keys"; remaining API is sales-reporting for artists/labels only (<https://get.bandcamp.help/en/articles/15263422>). **Verdict: API closed.**
- **Soundstripe / Artlist / Musicbed / Melodie:** subscription royalty-free libraries in the Uppbeat mould; Soundstripe and Melodie advertise partner/API programs for platforms. Not investigated in depth here — **UNVERIFIED**, but they occupy the same "paid partner API, indemnified catalog" slot as Epidemic Sound and would only matter if the self-host route is chosen and Pixabay's quality proves insufficient.
- **NASA / Free PD / incompetech (Kevin MacLeod):** genuinely free/CC0 or cheap-license instrumental pools; viable to hand-pick a handful, no API, pure manual curation.

---

## Summary table

| Provider | API open to new devs? | Playback in React Native? | Free tier? | ToS fit for paid mental-health app | Verdict |
|---|---|---|---|---|---|
| Deezer | No (new apps blocked) | Preview 30 s only; old SDK dead | n/a | Non-commercial only — fatal | Not viable |
| Amazon Music | No (closed beta, BD contact) | Web player API, no public SDK | n/a | Private partner terms | API closed |
| TIDAL | Metadata/playlist yes; consumer playback app needs approval | Preview 30 s only for 3rd parties (even with paid acct) | n/a | Consumer-integration oriented | Not viable (today) |
| SoundCloud | Only with Artist Pro sub + manual review | Full track via signed HLS; no native SDK | Ad-supported | Commercial widget use needs partnership; UGC catalog | Not viable |
| Boomplay | No discoverable dev API | — | — | UNVERIFIED | Not viable |
| Audiomack | Yes — self-serve OAuth 1.0a | Short-lived MP3 URL via `expo-audio`; no SDK | Yes (ad-supported) | API docs silent on commercial/health — needs written OK | Viable — narrow (Africa "music card") |
| Anghami | No (partner placeholder) | SDK, entitlement-gated | n/a | Private partner terms | API closed |
| JioSaavn | No official API | — | — | — | Not viable |
| Gaana | Historic; not reachable now | (had Player API) | — | UNVERIFIED | Not viable / unverifiable |
| Napster/Rhapsody | Discontinued (2025 sale) | — | — | — | API closed |
| Qobuz | No (signed dev agreement, email) | No RN SDK; sub required | n/a | NDA | API closed |
| Yandex Music | No official API (reverse-engineered) | — | — | — | Not viable |
| Pandora | No (partner form only), US/AU/NZ | Partner SDK | n/a | Private | API closed |
| Last.fm | Yes (metadata key) | None (no audio) | Yes non-commercial | Commercial metadata use needs agreement | Metadata only |
| 7digital / MassiveMusic | Commercial deal only | Signed stream URLs | Catalogue yes, streaming no | Full label licensing + royalties | API closed (self-serve) |
| **Pixabay Music (self-host)** | n/a (no music API; manual) | Yes — host in Convex, `expo-audio` | **Free** | Commercial OK, no attribution; check "standalone" + person-medicating clauses | **Viable — best zero-cost** |
| Epidemic Sound (self-host/API) | Partner agreement required | HLS via API under contract | No | Fully cleared + indemnified; offline is a contract point | Viable — heavy/costly |
| Uppbeat (self-host) | No API; manual download | Yes while subscribed | Limited free | In-app use allowed; no stockpiling, sync-only, lapses with sub | Viable with friction |
| Jamendo (paid sync licenses) | Yes (free API is NC-only + no caching) | Yes if licensed + self-hosted | API free tier NC only | Commercial = €29–1,189/track + credit/backlink | Viable via paid licenses |

## Recommendation for the map

**The "music stays fog, narrowed" call holds for *streaming*.** After this second pass, there is still no streaming provider that beats the earlier findings: Apple Music (viable, iOS-first, subscriber-gated) and YouTube (viable only as a visible video card) remain the frontier. Every other full-catalog API is closed or partner-only (Amazon, Pandora, Qobuz, Anghami, Napster, JioSaavn, Yandex, 7digital), non-commercial-only (Deezer, Jamendo's free API, Last.fm), or restricts third-party playback to 30-second previews (TIDAL, Deezer). The only genuinely open self-serve streaming API on the list is **Audiomack**, and it's a narrow win — an optional Africa-audience "music card" playing short-lived MP3 URLs through the existing `expo-audio` player, contingent on a written commercial-use confirmation, and no better than Apple Music for the general user base.

**What this pass adds is a new, non-streaming option worth putting on the roadmap:** *self-host a small curated licensed ambient/wellness catalog alongside the ElevenLabs `paths` tracks.* It reuses infrastructure Xolace already has (Convex storage + `expo-audio`), needs no external API at runtime, has no subscriber gate, and behaves identically on iOS and Android — removing every blocker that keeps streaming "in the fog." Cheapest path is **Pixabay Music** (free, commercial use explicitly granted, redistribution allowed, no attribution) with a one-time legal read of the "standalone distribution" clause and instrumental-only track selection; **Jamendo paid sync licenses** (~€29/track) or a **subscription library (Uppbeat / Epidemic Sound / Soundstripe)** are fallbacks if curated quality or indemnity matters. This stays **post-v1** and is a small, self-contained action type — but unlike the streaming options it is actually buildable without a partnership negotiation or an App Store subscriber-gating problem.
