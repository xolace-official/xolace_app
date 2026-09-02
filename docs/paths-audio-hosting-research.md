# Paths audio hosting — where to host ElevenLabs support audio, and how it reaches the app

Wayfinder ticket #270 (child of map #268). Question: where should Xolace host the
ElevenLabs-generated `paths` support audio (Xolace+ only), and how is it served to the
`expo-audio` player?

**One-line recommendation:** Host it in **Convex file storage**, on a new `audio_tracks`
table, using the exact pattern already shipping for mirror audio
(`mirrorAudioStorageId` + `getMirrorAudioUrl` + `use-mirror-audio.ts`). At Xolace's
catalogue size and premium-only traffic the cost delta vs. a dedicated CDN is single-digit
dollars per month, and Convex adds **zero new credentials, infra, or cache-purge path** —
the audio stays in the same deployment and trust boundary as `sessions`. Revisit only if
seek/scrub on long tracks proves broken (range-request support is undocumented — verify
with a `HEAD`) or if expiring URLs become a requirement; both point to the first-party
`get-convex/r2` component, which keeps the same row shape.

---

## 1. Assumptions and the size math

- **Encoding:** ElevenLabs TTS returns MP3; the repo already requests `Accept: audio/mpeg`
  with `model_id: eleven_v3` (`convex/ai/tts.ts`, `convex/vent.ts`). At **128 kbps** MP3,
  1 minute ≈ 0.94 MB (128 kbit/s ÷ 8 = 16 kB/s × 60). At 96 kbps ≈ 0.70 MB/min.
  Math below uses **128 kbps ≈ 1 MB/min** (conservative; drop ~25% at 96 kbps).
- **Track length:** 1–10 min, assume **5 min average** → ~5 MB/track at 128 kbps.
- **Catalogue:** 50–300 tracks. Upper bound 300 × 5 MB ≈ **1.5 GB stored** (50 tracks ≈ 0.25 GB).
- **Premium base (stated assumption):** ~**2,000 active Xolace+ subscribers/month** for
  the planning figure; sensitivity band 500 (low) to 5,000 (high).
- **Play counts (stated assumption):** audio is one `paths` action type among several;
  assume **8 audio-track plays per subscriber per month**.
- **No persistent client cache** (see §4) → re-plays and seek re-buffering re-download.
  Apply a **1.3× download multiplier**.
- **Planning egress:** 2,000 × 8 × 5 MB × 1.3 ≈ 104 GB → **100 GB/month**.
- **Heavy scenario:** 5,000 × 15 × 5 MB × 1.3 ≈ 488 GB → **480 GB/month**.
- **Requests:** ~2 GET per play → ~32k/month planning, ~150k heavy. Ingestion ~300 PUTs
  total, ~50/month ongoing.

### Cost table — monthly *incremental* cost (planning: 1.5 GB stored, 100 GB egress, 32k GET, 50 PUT)

| Option | Storage | Egress | Request fees | **Incremental $/mo (planning)** | Heavy (480 GB) | New credential + cache-purge path |
|---|---|---|---|---|---|---|
| **Convex file storage** (already on Pro, $25 base) | 1.5 GB — inside 100 GB included → **$0** [1] | 100 − 50 GB included = 50 GB × $0.12 = **$6.00** [1] | `getUrl` query calls inside 25M included → **$0** [1] | **≈ $6** | (480 − 50) × $0.12 ≈ **$52** | **None** — same deployment + secret as `sessions` |
| **Cloudflare R2** | 1.5 GB × $0.015 = $0.02 (10 GB free → $0) [2] | **$0** — zero egress from R2 (r2.dev / custom domain / S3 API) [2] | Class B 32k, 10M free → **$0** [2] | **≈ $0** | ≈ **$0** (Class B ≈ $0.05) | 1 access key; optional custom-domain purge |
| **AWS S3 + CloudFront** | S3 1.5 GB × $0.023 = $0.03 [3] | S3→CloudFront $0 [3]; CloudFront 100 GB × $0.085 (US, first 10 TB) = **$8.50** [4] (1 TB/mo free tier can absorb it initially [4]) | ~50k HTTPS req ≈ $0.05 [4] | **≈ $0–8.50** | CloudFront 480 GB × $0.085 ≈ **$41** | IAM key + distribution + OAC + signed-URL keypair + invalidations |
| **Bunny.net** | Edge Storage 1.5 GB × $0.01/region = $0.015 [5] | 100 GB, blended (mostly NA/EU $0.01, some Asia $0.03) ≈ **$1.10** [6] | No request fees [6] | **≈ $1** ($1/mo minimum dominates [6]) | ≈ 480 GB blended ≈ **$5** | 1 key + pull zone + token-auth secret + purge API |

**Takeaway:** at realistic scale every option is **$0–$10/month**, worst realistic case
~$40–52/month. Cost is not a differentiator. The decision is trust boundary + operational
surface + reuse of an existing shipped pattern.

---

## 2. Streaming / HTTP range-request support (progressive playback, seek)

- **Convex file storage:** the file-serving docs cover `ctx.storage.getUrl()` and using
  the URL in `img`/media elements but **say nothing about `Accept-Ranges` / byte-range
  requests** [7]. In-repo evidence that progressive playback works: `use-mirror-audio.ts`
  already streams a Convex-hosted MP3 through `useAudioPlayer(audioUrl)` today. Risk is
  **seek/scrub on long tracks** — if the server answers `Accept-Ranges: none`, players
  (iOS AVPlayer, Chrome) can't reposition without re-fetching from byte 0. **Action:**
  `HEAD` a real `getUrl` response and confirm `Accept-Ranges: bytes` before building seek
  UI on 10-minute tracks. Convex itself publishes the `get-convex/r2` component as the
  escape hatch when its own storage isn't the right fit [7].
- **Cloudflare R2:** served over the S3 API or a custom domain; both are S3-compatible and
  fronted by Cloudflare's CDN, which honours `Range`. Progressive playback + seek are
  standard.
- **S3 + CloudFront:** full range-request support; this is the reference setup for media
  delivery.
- **Bunny.net:** pull/stream zones are built for media and honour `Range`.

---

## 3. Signed-URL / expiring-URL support

- **Convex `getUrl`:** returns a **non-expiring** URL [7]. For this use case that is
  acceptable — the read query is Xolace+-gated (see §5) and the content is non-sensitive
  support audio, not user data. If expiry becomes a requirement, the `get-convex/r2`
  component returns **15-minute presigned S3 URLs** by default [8].
- **Cloudflare R2:** S3 **presigned GET URLs**, expiry configurable **1 second to 7 days**;
  presigned URLs work against the S3 API endpoint, **not** custom domains [9].
- **S3 + CloudFront:** **signed URLs and signed cookies**, arbitrary expiry, plus key-group
  rotation [4].
- **Bunny.net:** **token authentication** — signed URLs with an expiry timestamp on pull
  zones [6].

---

## 4. Offline caching on `expo-audio`

`expo-audio` does **no durable offline caching**:

- `AudioPlayerOptions.downloadFirst: true` downloads a remote HTTP(S) URL to the device
  **tmp directory** before playback — and the docs state "**The system will purge the file
  at its discretion**" [10][11]. It is a buffering aid, not a cache you control.
- `Audio.preload(source)` / the preload cache is for **near-instant next-play**, called in
  module scope; on iOS entries are consumed when the player picks them up [10][11]. Again
  not durable storage.
- Default (`downloadFirst: false`) is **progressive streaming from the remote URL** — the
  native player (AVPlayer / ExoPlayer) buffers ahead per `preferredForwardBufferDuration`
  [10][11].
- `AudioSource.headers` lets us attach HTTP headers to a remote source if we ever need
  header auth instead of a query-minted URL [10][11].

**What we would build for true offline** (only if "download this path for later" becomes a
product requirement — not needed for v1): use `expo-file-system` `downloadAsync()` to pull
the track URL into `documentDirectory` keyed by track `slug`, persist the local `file://`
path, and hand that to `useAudioPlayer` when present, else fall back to the remote URL.
This is storage-backend-agnostic — it works identically whether the URL is Convex or a CDN.

---

## 5. Operational complexity

- **Convex:** none. No new credential (ElevenLabs key + Convex deploy key already exist),
  no bucket, no CDN distribution, no cache-invalidation path. Audio lives in the same
  deployment and trust boundary as `sessions` / `emotional_metadata`, matching the
  privacy-first posture. Ingestion and read paths are copy-edits of code already in
  `convex/ai/tts.ts` and `convex/sessions.ts`.
- **R2 / S3+CloudFront / Bunny:** each adds **one more secret** (bucket access key, or
  keypair for signed URLs), an external resource to provision, and a **cache-purge path**
  to reason about whenever a track is regenerated (stale edge copy). S3+CloudFront is the
  heaviest (distribution + OAC + signed-URL key group + invalidation quota).

---

## 6. Recommendation

**Use Convex file storage.** Rationale, in priority order:

1. **Zero operational surface added.** No new credential, no cache-purge path, same trust
   boundary as `sessions`.
2. **The pattern already ships.** `mirrorAudioStorageId: v.id("_storage")` on the row +
   `getMirrorAudioUrl` query returning `ctx.storage.getUrl()` + `use-mirror-audio.ts`
   feeding `useAudioPlayer`. `audio_tracks` is the same shape with a fixed catalogue
   instead of per-session generation.
3. **Cost is a rounding error** — ~$6/month planning, ~$52/month in the heavy scenario;
   the cheapest CDN saves at most ~$50/month and costs a credential + purge path.
4. **Catalogue is tiny** (≤ 1.5 GB) and **premium-gated** — CDN edge-cache economics and
   zero-egress pricing don't matter at this volume.

**Explicit revisit triggers → move to `get-convex/r2` (same `audio_tracks` row, swap
`ctx.storage.getUrl` for `r2.getUrl`):**

- `HEAD` on a `getUrl` response does **not** return `Accept-Ranges: bytes` and seek/scrub
  on long tracks is broken.
- Expiring URLs become a hard requirement.
- Monthly audio egress sustains past ~500 GB (then R2's $0 egress starts to matter).

Migration cost is low **because URLs are minted per-request in a query, never stored on the
row** (§7) — only the ingestion `store` call and the read query's URL line change.

---

## 7. Integration shape

### New table (`convex/schema.ts`)

```ts
audio_tracks: defineTable({
  slug: v.string(),              // stable id for deterministic tag-binding + idempotent re-ingest
  title: v.string(),
  topic: v.string(),             // picked-topic key the track is bound within
  tags: v.array(v.string()),     // tag-match binding within the topic
  storageId: v.id("_storage"),   // Convex file storage — the ONLY location reference on the row
  durationSec: v.number(),
  voiceSlug: v.optional(voiceSlugValidator),
  active: v.boolean(),
})
  .index("by_topic", ["topic"])
  .index("by_slug", ["slug"])
```

Schema-safe: new table, additive (per CLAUDE.md "always safe to add new tables").

### Ingestion: ElevenLabs output → storage → row

A build-time / admin `internalAction` under `convex/ai/` (near-verbatim
`generateMirrorAudio` from `convex/ai/tts.ts`), driven by a **checked-in manifest**
(`slug`, `title`, `topic`, `tags`, script text, `voiceSlug`) so generation is reproducible
and reviewable:

1. `fetch("https://api.elevenlabs.io/v1/text-to-speech/{voiceId}", { headers: { "xi-api-key", Accept: "audio/mpeg" }, body: { text, model_id: "eleven_v3", voice_settings } })` — identical call to the mirror-audio path.
2. `const blob = new Blob([await res.arrayBuffer()], { type: "audio/mpeg" })`.
3. `const storageId = await ctx.storage.store(blob)` — Convex file storage [7].
4. `await ctx.runMutation(internal.audioTracks.upsert, { slug, title, topic, tags, storageId, durationSec, voiceSlug, active: true })` — one row per track. Re-running with an existing `slug` patches `storageId` and calls `ctx.storage.delete()` on the old blob (idempotent re-ingest).

### Read path: row → URL → player

1. **Query, per session, Xolace+-gated:** `paths.getBoundAudioTrack({ sessionId })` —
   `requireAuth` + premium entitlement check (reuse the `paths` gate), load candidate rows
   for the picked topic via `by_topic`, **deterministically pick by tag-match** (stable
   sort on `slug` to break ties), then:
   ```ts
   return {
     slug: row.slug,
     title: row.title,
     durationSec: row.durationSec,
     url: await ctx.storage.getUrl(row.storageId),   // minted here, per request
   };
   ```
2. **Client hook**, mirroring `use-mirror-audio.ts`:
   ```ts
   const data = useQuery(api.paths.getBoundAudioTrack, sessionId ? { sessionId } : "skip");
   const player = useAudioPlayer(data?.url ?? null);
   const status = useAudioPlayerStatus(player);
   ```

### URLs stored or minted?

**Minted per request**, in the read query — never persisted. The row stores only
`storageId: v.id("_storage")`. This is the existing `getMirrorAudioUrl` contract and is
what keeps a future backend swap cheap.

---

## Sources

- [1] Convex pricing — file storage $0.03/GB (Pro, 100 GB included), data egress $0.12/GB (Pro, 50 GB included), function calls 25M included on Pro, $25/developer/month. <https://www.convex.dev/pricing>
- [2] Cloudflare R2 pricing — Standard storage $0.015/GB-month, Class A $4.50/M, Class B $0.36/M, **egress free**, free tier 10 GB-month + 1M Class A + 10M Class B. <https://developers.cloudflare.com/r2/pricing/>
- [3] AWS S3 pricing — S3 Standard $0.023/GB-month (first 50 TB), PUT $0.005/1k, GET $0.0004/1k, **S3→CloudFront transfer free**. <https://aws.amazon.com/s3/pricing/>
- [4] AWS CloudFront pricing — pay-as-you-go US data transfer out $0.085/GB (first 10 TB), free tier 1 TB/month + 10M requests, signed URLs / signed cookies supported. <https://aws.amazon.com/cloudfront/pricing/> (per-GB tier confirmed via 2026 breakdowns: <https://blog.blazingcdn.com/en-us/aws-cloudfront-pricing-2026-per-gb-cost-and-regional-breakdown>)
- [5] Bunny Edge Storage pricing — HDD $0.01/GB/region (first 2 regions), SSD $0.02/GB/region, no request/egress-to-CDN fees, $1/month minimum. <https://bunny.net/pricing/storage/>
- [6] Bunny CDN pricing — bandwidth $0.01/GB (EU & NA), $0.03/GB (Asia & Oceania), no request fees, $1/month minimum; token authentication for secure URLs. <https://bunny.net/pricing/>
- [7] Convex — Serving Files: `ctx.storage.getUrl()` for URLs, HTTP-action responses capped at 20 MB, R2 component recommended for expiring URLs; docs do not document range-request behaviour. <https://docs.convex.dev/file-storage/serve-files>
- [8] `get-convex/r2` component — `r2.getUrl()` returns signed S3 URLs that expire (default 15 min); URLs minted per request from a stored object key; `r2.store()` accepts a Blob/Buffer from an action. <https://github.com/get-convex/r2>
- [9] Cloudflare R2 — S3 presigned URLs: GET supported, expiry 1 second to 7 days, S3 API endpoint only (not custom domains). <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>
- [10] Expo Audio (`expo-audio`) SDK reference — `useAudioPlayer(source, options)` accepts a remote URL; `AudioPlayerOptions.downloadFirst` downloads to the device tmp dir and "the system will purge the file at its discretion"; `Audio.preload()` preload cache; `AudioSource.headers` for remote HTTP headers; `preferredForwardBufferDuration` for streaming buffer. <https://docs.expo.dev/versions/v55.0.0/sdk/audio/>
- [11] Repo vendored copy of the same reference: `docs/expo-audio.md` (Expo docs, modificationDate 2026-02-26, SDK 55).
- In-repo precedents: `convex/ai/tts.ts` (`generateMirrorAudio`: ElevenLabs → `ctx.storage.store` → row), `convex/sessions.ts` (`getMirrorAudioUrl`: row → `ctx.storage.getUrl` per request), `convex/schema.ts` (`mirrorAudioStorageId: v.optional(v.id("_storage"))`), `src/features/reflect/hooks/use-mirror-audio.ts` (`useQuery` URL → `useAudioPlayer`).
