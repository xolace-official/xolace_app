# Paths storage backend — hosting a self-curated audio **and music** catalogue (200–400 files)

Wayfinder ticket #321 (child of map #268). Supersedes the volume assumptions in #270
(`docs/paths-audio-hosting-research.md`); the backend conclusion of #270 survives, the
numbers behind it do not.

**One-line recommendation:** Stay on **Convex file storage (bare `ctx.storage`) — install
no component.** Range requests are now **empirically verified** (`accept-ranges: bytes`,
a real `206 Partial Content` on an `audio/mpeg` blob in our own dev deployment — §2), which
closes the one open risk #270 flagged; the music half raises planning egress from ~100 GB to
~320 GB/month (~$33/mo instead of ~$6/mo) which is a bigger number but not a different
decision. Ingest the 200–400 local files with a **~40-line repo script over the upload-URL
flow**, idempotent on `slug`. The tradeoff we are knowingly buying: **$0.12/GB egress that
Cloudflare R2 would give us for $0**. Revisit when sustained audio egress passes
**~500 GB/month** (≈$54/mo), at which point `@convex-dev/r2` is the swap and the row shape
does not change.

---

## 1. Corrected size + egress math (both families)

### Stated assumptions

| Input | TTS (ElevenLabs) | Music (curated, licensed) |
|---|---|---|
| Container / codec | MP3 (`Accept: audio/mpeg`, `convex/ai/tts.ts`) | MP3 (what stock-music libraries ship) |
| Bitrate | **128 kbps** → 0.94 MB/min | **192 kbps** → 1.41 MB/min (320 kbps sensitivity below) |
| Average length | **5 min** → **≈4.7 MB/track** | **5 min** → **≈7.0 MB/track** (ambient/wellness beds run 3–6 min) |
| Count, first curation | **200** | **200** |
| **Stored** | **≈0.94 GB** | **≈1.4 GB** (≈2.4 GB if we curate at 320 kbps) |

- **Total stored: ≈2.4 GB** (≈3.4 GB at 320 kbps music). #270 assumed 1.5 GB. Both are
  inside Convex Pro's **100 GB included** file storage [1], so storage cost is **$0** either way.
  Storage was never the axis; egress is.
- **Premium base (assumption, carried from #270):** ~**2,000 active Xolace+ subscribers/month**;
  sensitivity band 500 → 5,000.
- **Plays per subscriber per month (assumption):** **8 TTS** (as #270) + **12 music** — music is
  ambient background for an action, so it is played more often and repeated more than a
  one-shot spoken support track.
- **No durable client cache** — `expo-audio`'s `downloadFirst` writes to the tmp dir and "the
  system will purge the file at its discretion" [8]. Keep #270's **1.3× re-download multiplier**.
  Convex *does* return `cache-control: private, max-age=2592000` (verified, §2), so a device that
  keeps its HTTP cache warm re-downloads less — **unverified** whether AVPlayer/ExoPlayer honour
  it for progressive media, so it is not in the math.

### Egress

| Scenario | TTS GB/mo | Music GB/mo | **Total GB/mo** |
|---|---|---|---|
| **Planning** (2,000 subs; 8 + 12 plays) | 2,000×8×4.7 MB×1.3 ≈ **98** | 2,000×12×7.0 MB×1.3 ≈ **218** | **≈316 GB** |
| Low (500 subs; 8 + 12) | ≈24 | ≈55 | ≈79 GB |
| **Heavy** (5,000 subs; 15 + 25) | ≈458 | ≈1,138 | **≈1,596 GB** |

Requests: ~2 GET/play → ~80k/mo planning, ~400k/mo heavy. Ingestion: 200–400 PUTs, once.

### Cost table — monthly *incremental* cost

| Option | Storage (2.4 GB) | Egress | Requests | **Planning (316 GB)** | Heavy (1,596 GB) | New credential / ops |
|---|---|---|---|---|---|---|
| **Convex file storage** (already on Pro, $25 base) | inside 100 GB included → **$0** [1] | (316 − 50 incl.) × $0.12 = **$31.92** [1] | inside 25M function calls → **$0** [1] | **≈ $32** | (1,596 − 50) × $0.12 ≈ **$186** | **None** — same deployment/trust boundary as `sessions` |
| **Cloudflare R2** (via `@convex-dev/r2`) | 2.4 GB, 10 GB free → **$0** [2] | **$0** — R2 egress is free [2] | Class B 80k, 10M free → **$0** [2] | **≈ $0** | **≈ $0** (Class B ≈ $0.14) | 1 bucket + 4 env vars + 1 component + cache/purge reasoning |
| S3+CloudFront / Bunny | — | — | — | ≈$27 / ≈$3 | ≈$136 / ≈$16 | heavier than R2, strictly dominated — see #270 §1 [3][4][5][6] |

**Does the music half flip #270's conclusion? No.** It multiplies the delta by ~5× and it is
still, in absolute terms, **$32/month** — less than two Convex seats — against adding a
credential, a component, a second trust boundary and a migration. At the heavy end (5,000
subscribers × 40 plays) it is $186/month, but that scenario implies ~$50k/yr of Xolace+
revenue; it is a revisit trigger, not a v1 design input. The honest break-even is stated in §6.

---

## 2. Range requests / seek — **VERIFIED**

#270 flagged this as unverified. It is now verified against **our own dev deployment**
(`groovy-mandrill-892.eu-west-1`), on a real `audio/mpeg` blob written by the shipping
mirror-audio path, using a URL minted by `ctx.storage.getUrl()` (obtained by running the
existing `internal.intake.storageUrls` query against a `_storage` id).

```
$ curl -sSI https://groovy-mandrill-892.eu-west-1.convex.cloud/api/storage/<uuid>
HTTP/2 200
content-type: audio/mpeg
content-length: 157196
accept-ranges: bytes
cache-control: private, max-age=2592000
digest: sha-256=XyXd/AcuiJ/kYfkBBgPGfZvfEvuyaK5tpgX7bPVuj94=

$ curl -sS -D - -o /dev/null -H 'Range: bytes=50000-50999' <same URL>
HTTP/2 206
content-type: audio/mpeg
content-length: 1000
accept-ranges: bytes
content-range: bytes 50000-50999/157196
```

Confirmed independently on an `image/jpeg` blob (`avatars` row) — same headers, same `206`.
So: **Convex file storage serves byte ranges.** Progressive playback and seek/scrub on long
music tracks work; AVPlayer/ExoPlayer will reposition without re-fetching from byte 0. The
`Accept-Ranges` revisit trigger from #270 is **retired**.

Two facts worth carrying forward from the same capture:

- The serving URL is a **UUID path**, not the `_storage` id — `/api/storage/<uuid>`. Hitting
  `/api/storage/<storageId>` returns `400 InvalidStoragePath`. URLs must come from `getUrl`.
- `cache-control: private, max-age=2592000` (30 days) — a *private* cache directive, so no
  shared/CDN cache; each device may cache for itself. This is why egress is per-device.

---

## 3. The three components vs bare `ctx.storage`

| | What it adds over `ctx.storage` | Backend | Credentials | Bulk local ingest | Maturity |
|---|---|---|---|---|---|
| **`@convex-dev/r2`** | Real substitution: files live in **R2, not Convex** (free egress). Ships a metadata table in Convex, `r2.store(ctx, blob, { key, type })` from an action with **custom object keys**, `r2.syncMetadata(ctx, key)`, `r2.getUrl(key, { expiresIn })` (**default 15 min** signed), `r2.getMetadata`, `r2.deleteByKey`, `useUploadFile` React hook, and `checkUpload`/`onUpload`/`onSyncMetadata` callbacks [7][12]. | Cloudflare R2 | `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET` [7] | No first-party bulk tool — but out-of-band `rclone`/`wrangler` upload + `syncMetadata` per key is a genuine path our own script wouldn't have to POST through | v0.10.x, Convex first-party |
| **`files-control`** | Access-control layer *on top of* either backend: `generateUploadUrl` + `finalizeUpload` two-step, per-file **access keys**, `createDownloadGrant` (time-limited, usage-capped, optional password), `buildDownloadUrl`, `cleanupExpired` cron, `listFilesByAccessKeyPage` [9]. | Convex storage **or** R2 | R2 creds only if R2 backend | Not addressed [9] | v0.5.x, community |
| **`convex-fs`** | Filesystem semantics: **paths/directories** (`/music/ambient/x.mp3`), atomic move/copy/delete with preconditions, **reference-counted dedupe**, soft deletes with grace periods, signed **Bunny.net CDN** URLs with edge transforms [10]. | **Bunny.net only** | Bunny storage+CDN keys | Not addressed [10] | **v0.3.0, alpha — "APIs may change before 1.0"** [10] |

**Call: install none of them.**

- **`convex-fs`** is out on maturity alone (alpha, pre-1.0 API churn) and drags in a third
  vendor (Bunny) for path semantics we don't need — our catalogue is flat and addressed by
  `slug`, not by directory. Dedupe buys nothing on 400 hand-curated distinct tracks.
- **`files-control`** solves per-user, per-tenant file access control — password-gated,
  usage-capped download grants. Our access control is one boolean (Xolace+) enforced in the
  read query the way `getMirrorAudioUrl` already does it. It is a component and a cron to
  maintain for a problem we don't have.
- **`@convex-dev/r2`** is the only one that changes anything material (free egress, expiring
  URLs, `rclone`-able bulk ingest). It is the right escape hatch and the row shape is identical
  — but at $32/month it is not worth a fifth credential today. Note its default 15-minute
  signed URL is a *cost* for us, not a benefit: it must be widened (`expiresIn`) or a long
  music track started near expiry risks a failed range re-request mid-playback.

---

## 4. Ingest: 200–400 local files, idempotent on `slug`

**Rejected:** `npx convex import`. It *does* import file storage from a ZIP snapshot,
preserving `_storage` `_id`/`_creationTime`/`contentType` [11] — but it is a snapshot restore
tool: hand-building the ZIP + `generated_schema.jsonl` is more work than the script, and
`--replace` on `_storage` would take our existing mirror-audio blobs with it. Wrong tool.

**Recipe — a repo script over the upload-URL flow** (`scripts/ingest-audio-tracks.ts`, run
with `bun`, pointed at a checked-in manifest + a local folder):

1. **Manifest** (`docs/… or scripts/audio-manifest.json`, checked in, reviewable): one entry per
   track — `slug`, `file` (path relative to the media folder), `title`, `topic`, `tags`,
   `family: "tts" | "music"`, `durationSec`, `voiceSlug?`, and for music the licence block (§5).
   The manifest is the source of truth; the audio files themselves are **not** committed.
2. **Per file, in the script:** `const {storageId} = await fetch(await client.mutation(api.audioTracks.generateUploadUrl), { method: "POST", headers: {"Content-Type": "audio/mpeg"}, body: await readFile(path) }).then(r => r.json())`. The upload URL is short-lived (**expires in 1 hour**) so mint one per file, and the POST has a **2-minute timeout** — fine for ≤15 MB tracks. There is **no file-size limit** on this flow; the 20 MB cap applies only to `ctx.storage.store` inside an HTTP action [12]. Do them with a small concurrency limit (4–6), not `Promise.all` over 400.
3. **Then** `await client.mutation(api.audioTracks.upsert, { slug, storageId, ...manifestEntry })`.
   The mutation is where idempotency lives: look up `by_slug`; if a row exists **and** the
   manifest's content hash is unchanged, `ctx.storage.delete(newStorageId)` and return (no-op);
   if changed, patch the row and `ctx.storage.delete(oldStorageId)`; else insert. Re-running the
   whole script is then safe and cheap — the only waste is re-uploading bytes, which a
   `sha256`/size column in the manifest lets step 2 skip by pre-checking `api.audioTracks.needsUpload({slug, sha256})`.

Both `generateUploadUrl` and `upsert` are admin-only (gate on an `INGEST_SECRET` env arg, or
make them `internalMutation` and drive the script with `convex run` — the latter needs no new
secret and matches how `intake.storageUrls` is already used).

---

## 5. Licence / attribution on the row

A curated music track's licence must travel with the blob, or the first "can we still ship
this?" question costs a day of archaeology. Add to the `audio_tracks` row, required whenever
`family === "music"`:

```ts
licence: v.optional(v.object({
  source: v.string(),            // "pixabay" | "jamendo" | "uppbeat" | "epidemic" | "direct"
  sourceUrl: v.string(),         // canonical page the track was obtained from
  licenceName: v.string(),       // "Pixabay Content License" | "Jamendo Sync Standard" | ...
  licenceUrl: v.string(),        // the terms as they read on acquisition date
  artist: v.string(),
  attributionRequired: v.boolean(),
  attributionText: v.optional(v.string()),  // the exact string to render if required
  acquiredAt: v.number(),        // ms epoch — pins which version of the terms applied
  licenceRef: v.optional(v.string()),       // invoice / order / download id
  licenceProofStorageId: v.optional(v.id("_storage")), // receipt or licence PDF, same storage
})),
```

Three notes: (a) `attributionText` is stored **verbatim**, not composed at render time, so the
credit line can never drift from what the licence demanded; (b) `acquiredAt` + `licenceUrl` is
the pair that answers "under which terms?" when a library silently rewrites its licence page;
(c) the licence PDF goes in the *same* Convex storage — one backend, one place to look. Any
track whose `attributionRequired` is true must have the credit rendered wherever it plays, so
the read query returns `attributionText` alongside the URL.

---

## 6. Recommendation and revisit triggers

**Convex file storage, bare `ctx.storage`, no component.** Same conclusion as #270, now with
the music volume priced in and the range-request risk retired by measurement rather than
assumption. The `audio_tracks` shape from #270 §7 stands, plus `family` and `licence`.

**The tradeoff, named:** we pay Convex $0.12/GB for egress that R2 gives away. At planning
volume that is **$32/month**; the price of *not* paying it is a fifth production credential,
a component upgrade path, a second trust boundary for content we currently keep beside
`sessions`, and expiring-URL handling in the player.

**Revisit → `@convex-dev/r2`** (same row, swap `storageId: v.id("_storage")` for `key: v.string()`,
`ctx.storage.getUrl` for `r2.getUrl(key, { expiresIn })`) when **any** of:

- Sustained audio egress passes **~500 GB/month** (≈$54/mo, and climbing linearly) — the point
  where the credential starts paying for itself.
- The music catalogue passes **~50 GB stored** (i.e. we go from hundreds of tracks to
  thousands, or to lossless), where R2's $0.015/GB vs Convex's $0.03/GB [1][2] also bites.
- We need **expiring URLs** — e.g. a licence term that forbids a permanently public asset URL.
  (Check this against the licence of any library we buy from *before* curating from it.)
- Bulk re-ingest becomes routine (weekly catalogue refreshes), where `rclone copy` + `syncMetadata`
  beats maintaining our own upload script.

**Explicitly not triggers:** seek/scrub (verified working, §2), file-size limits (none on the
upload-URL flow), or the 200–400 file count (trivial for either backend).

### Unverified

- Whether AVPlayer/ExoPlayer honour Convex's `cache-control: private, max-age=2592000` for
  progressive media — the 1.3× re-download multiplier assumes they mostly don't.
- Music bitrate/length are **assumptions** (192 kbps, 5 min) until the first curation batch
  exists; a 320 kbps / 8-min catalogue roughly **doubles** the music egress row.
- Play-count assumptions (12 music plays/subscriber/month) are a planning figure, not data.

---

## Sources

- [1] Convex pricing — Pro $25/developer/month; file storage 100 GB included, $0.03/additional GB; database storage 50 GB included, $0.20/GB; **data egress 50 GB included, $0.12/additional GB**; function calls 25M included, $2/additional 1M; action compute 250 GB-hours included. <https://www.convex.dev/pricing>
- [2] Cloudflare R2 pricing — Standard storage **$0.015/GB-month**, Class A **$4.50/million**, Class B **$0.36/million**, **egress free**; free tier 10 GB-month + 1M Class A + 10M Class B. <https://developers.cloudflare.com/r2/pricing/>
- [3] AWS S3 pricing. <https://aws.amazon.com/s3/pricing/>
- [4] AWS CloudFront pricing. <https://aws.amazon.com/cloudfront/pricing/>
- [5] Bunny Edge Storage pricing. <https://bunny.net/pricing/storage/>
- [6] Bunny CDN pricing. <https://bunny.net/pricing/>
- [7] `@convex-dev/r2` component — `r2.store(ctx, blob, { key, type })` from actions with custom object keys, `r2.syncMetadata(ctx, key)`, `r2.getUrl(key, { expiresIn })` defaulting to **15 minutes**, `r2.getMetadata`, `r2.deleteByKey`, `useUploadFile` hook, `checkUpload`/`onUpload`/`onSyncMetadata` callbacks; env vars `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`; v0.10.x. <https://www.convex.dev/components/cloudflare-r2/cloudflare-r2.md> · <https://www.convex.dev/components/cloudflare-r2/llms.txt> · <https://www.convex.dev/components/cloudflare-r2/SKILL.md>
- [8] Expo Audio SDK reference — `downloadFirst` writes to the tmp dir, "The system will purge the file at its discretion"; default is progressive streaming from the remote URL. <https://docs.expo.dev/versions/v55.0.0/sdk/audio/> (vendored: `docs/expo-audio.md`)
- [9] `files-control` component — `generateUploadUrl` + `finalizeUpload` two-step presigned flow, per-file access keys, `createDownloadGrant` (time-limited, usage-capped, optional password), `buildDownloadUrl`, `cleanupExpired` cron, `listFilesByAccessKeyPage`/`hasAccessKey`; backends Convex storage **or** R2; v0.5.8. <https://www.convex.dev/components/files-control/files-control.md> · <https://www.convex.dev/components/files-control/llms.txt>
- [10] `convex-fs` component — filesystem paths/directories, atomic move/copy/delete with preconditions, reference-counted blob dedupe, soft deletes with grace periods, signed **Bunny.net** CDN URLs; **alpha, v0.3.0, "APIs may change before 1.0"**. <https://www.convex.dev/components/convex-fs/convex-fs.md> · <https://www.convex.dev/components/convex-fs/llms.txt>
- [11] Convex — Data import: ZIP snapshot imports include file storage and preserve `_storage` `_id`/`_creationTime`/`contentType`; imports into non-empty tables fail without `--replace`/`--append`; consumes database **and** file bandwidth. <https://docs.convex.dev/database/import-export/import>
- [12] Convex — Upload files: `storage.generateUploadUrl()` returns a URL that **expires in 1 hour**; POST with a `Content-Type` header returns JSON containing `storageId`; **no file-size limit**, 2-minute POST timeout; `ctx.storage.store(blob)` inside an HTTP action is **limited to 20 MB**. <https://docs.convex.dev/file-storage/upload-files>
- [13] **Empirical (§2), 2026-09-08**, dev deployment `groovy-mandrill-892.eu-west-1`: `curl -I` on a `ctx.storage.getUrl()` URL for an `audio/mpeg` blob → `accept-ranges: bytes`, `cache-control: private, max-age=2592000`; `Range: bytes=50000-50999` → `206` + `content-range: bytes 50000-50999/157196`, 1000 bytes returned. URL minted via `convex run intake:storageUrls`.
- In-repo precedents: `convex/ai/tts.ts` (`generateMirrorAudio`: ElevenLabs → `ctx.storage.store` → row), `convex/sessions.ts:913` (`getMirrorAudioUrl`: row → `ctx.storage.getUrl` per request), `convex/intake.ts:183` (`storageUrls` internalQuery), `src/features/reflect/hooks/use-mirror-audio.ts`, `docs/paths-audio-hosting-research.md` (#270), `docs/paths-music-streaming-feasibility.md` §Part 2 (#271).
