// Kindling catalogue ingestion (#328, docs/paths-v1.md §3.4).
//
// Uploads local audio + thumbnail files to R2 and upserts their rows into
// `audio_tracks`. Idempotent — safe to re-run the whole manifest.
//
// Topic art (#354): `topics.json` beside the manifest holds
// `[{ slug, title?, thumbPath, thumbSha256 }]` and is ingested as a first
// pass into `topics` via `upsertTopic`. Covers follow the track-thumbnail
// spec — square ~600×600, ≤ 80 KB WebP/JPEG — and share the content-addressed
// `thumb/<sha>.<ext>` key space. A cover whose key already backs the slug's
// row is not re-uploaded, so a title-only edit is cheap; an unknown slug is
// rejected by the mutation and leaves no row or blob behind.
//
// Dev fixtures (scripts/kindling/dev/) and the real curated catalogue
// (scripts/kindling/prod/, ~400 tracks) are separate manifest+topics+media
// trees — never one set uploaded to two deployments. `--prod` targets the
// prod Convex deployment/bucket AND defaults manifest/media to the prod/
// tree, so a bare `--prod` can't accidentally push the tiny dev fixture set
// as if it were the real catalogue. Pass `--manifest`/`--media` explicitly
// to override either side independently.
//
// Usage:
//   bun scripts/kindling/ingest.ts --update-hashes   # fill in sha256 fields from local files
//   bun scripts/kindling/ingest.ts --update-hashes --prod (or --manifest scripts/kindling/prod/manifest.json explicitly)
//   bun scripts/kindling/ingest.ts                    # dev deployment + dev/ fixtures
//   bun scripts/kindling/ingest.ts --prod             # prod deployment + prod/ curated catalogue
//   bun scripts/kindling/ingest.ts --manifest scripts/kindling/dev/manifest.json   # topics.json is read from the same dir
//
// Drives Convex via the local `convex` CLI (reuses your existing CLI login — no new secret).

import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type SharedFields = {
  slug: string;
  title: string;
  topic: string;
  tags: string[];
  audioPath: string;
  thumbPath: string;
  durationSec: number;
  sha256: string;
  thumbSha256: string;
  newUntil?: number;
};
type SupportTrack = SharedFields & {
  family: "support";
  narrators?: string[];
  series?: string;
  seriesTitle?: string;
  episodeNumber?: number;
  tier?: number;
  safetyReviewedAt?: number;
};
type MusicTrack = SharedFields & { family: "music"; licence: Record<string, unknown> };
type ManifestTrack = SupportTrack | MusicTrack;
type ManifestTopic = { slug: string; title?: string; thumbPath: string; thumbSha256: string };

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const prod = args.includes("--prod");
const updateHashes = args.includes("--update-hashes");
const catalogueDir = prod ? "prod" : "dev";
const manifestPath = path.resolve(flag("manifest", `scripts/kindling/${catalogueDir}/manifest.json`));
const topicsPath = path.join(path.dirname(manifestPath), "topics.json");
const mediaDir = path.resolve(flag("media", `scripts/kindling/${catalogueDir}/media`));
const CONCURRENCY = 5;
const UPLOAD_TIMEOUT_MS = 10 * 60_000; // audio files can be tens of MB

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("hex")));
  });
}

function convexRun(fn: string, jsonArgs: unknown): any {
  const out = execFileSync(
    "npx",
    ["convex", "run", fn, JSON.stringify(jsonArgs), ...(prod ? ["--prod"] : [])],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  return JSON.parse(out);
}

function ext(filePath: string): string {
  return path.extname(filePath).slice(1);
}

async function putFile(url: string, filePath: string): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    body: readFileSync(filePath),
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`upload failed (${res.status}): ${filePath}`);
}

async function ingestOne(track: ManifestTrack, sharedThumbKeys: Set<string>): Promise<void> {
  if (track.family === "support" && (track.tier ?? 0) >= 3 && !track.safetyReviewedAt) {
    throw new Error(`tier ${track.tier} requires safetyReviewedAt`);
  }

  // Thumb before audio (docs/paths-v1.md §3.4 step 2): if the run dies
  // mid-track, a row is never created pointing at a missing thumbnail.
  const thumbKey = `thumb/${track.thumbSha256}.${ext(track.thumbPath)}`;
  const audioKey = `${track.family}/${track.slug}/${randomUUID()}.${ext(track.audioPath)}`;
  try {
    const thumbUpload = convexRun("ai/paths/audioTracks:mintUploadUrl", { key: thumbKey });
    await putFile(thumbUpload.url, path.resolve(mediaDir, track.thumbPath));

    const audioUpload = convexRun("ai/paths/audioTracks:mintUploadUrl", { key: audioKey });
    await putFile(audioUpload.url, path.resolve(mediaDir, track.audioPath));

    const { audioPath: _audioPath, thumbPath: _thumbPath, ...rest } = track;
    const result = convexRun("ai/paths/audioTracks:upsertTrack", {
      track: { ...rest, key: audioUpload.key, thumbKey: thumbUpload.key },
    });
    console.log(`${track.slug}: ${result.action}`);
  } catch (err) {
    // Blobs from this attempt are orphans; deleting a key that was never
    // uploaded is a no-op. A thumbKey shared with another manifest entry is
    // left alone — a concurrent worker may be mid-upload to it and not yet
    // have a row referencing it, so deleting here would race it (#354);
    // an unreferenced shared blob is a harmless orphan for GC, not a bug.
    try {
      convexRun("ai/paths/audioTracks:discardUpload", {
        audioKey,
        thumbKey: sharedThumbKeys.has(thumbKey) ? undefined : thumbKey,
      });
    } catch (cleanupErr) {
      console.error(`${track.slug}: cleanup failed — ${(cleanupErr as Error).message}`);
    }
    throw err;
  }
}

async function ingestTopic(
  topic: ManifestTopic,
  liveThumbKeys: Record<string, string>,
  sharedThumbKeys: Set<string>,
): Promise<void> {
  const thumbKey = `thumb/${topic.thumbSha256}.${ext(topic.thumbPath)}`;
  const uploaded = liveThumbKeys[topic.slug] !== thumbKey;
  try {
    if (uploaded) {
      const upload = convexRun("ai/paths/audioTracks:mintUploadUrl", { key: thumbKey });
      await putFile(upload.url, path.resolve(mediaDir, topic.thumbPath));
    }
    const { thumbPath: _thumbPath, ...rest } = topic;
    const result = convexRun("ai/paths/audioTracks:upsertTopic", { topic: { ...rest, thumbKey } });
    console.log(`topic ${topic.slug}: ${result.action}`);
  } catch (err) {
    if (!uploaded) throw err;
    // See the matching comment in ingestOne — don't race a concurrent
    // worker uploading to the same content-addressed key.
    if (!sharedThumbKeys.has(thumbKey)) {
      try {
        convexRun("ai/paths/audioTracks:discardUpload", { thumbKey });
      } catch (cleanupErr) {
        console.error(`topic ${topic.slug}: cleanup failed — ${(cleanupErr as Error).message}`);
      }
    }
    throw err;
  }
}

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: limit }, async () => {
      let item: T | undefined;
      while ((item = queue.shift())) await worker(item);
    }),
  );
}

async function main() {
  const manifest: ManifestTrack[] = JSON.parse(readFileSync(manifestPath, "utf8"));
  const topics: ManifestTopic[] = JSON.parse(readFileSync(topicsPath, "utf8"));

  if (updateHashes) {
    for (const track of manifest) {
      track.sha256 = await sha256File(path.resolve(mediaDir, track.audioPath));
      track.thumbSha256 = await sha256File(path.resolve(mediaDir, track.thumbPath));
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    for (const topic of topics) {
      topic.thumbSha256 = await sha256File(path.resolve(mediaDir, topic.thumbPath));
    }
    writeFileSync(topicsPath, JSON.stringify(topics, null, 2) + "\n");
    console.log(`Updated hashes for ${manifest.length} tracks and ${topics.length} topics`);
    return;
  }

  if (!prod) execFileSync("npx", ["convex", "dev", "--once"], { stdio: "inherit" });

  // A thumbKey used by >1 manifest/topic entry may have concurrent workers
  // uploading to it at once; cleanup must never delete those (#354 race).
  const thumbKeyOf = (t: ManifestTrack | ManifestTopic) => `thumb/${t.thumbSha256}.${ext(t.thumbPath)}`;
  const thumbKeyCounts = new Map<string, number>();
  for (const entry of [...manifest, ...topics]) {
    const key = thumbKeyOf(entry);
    thumbKeyCounts.set(key, (thumbKeyCounts.get(key) ?? 0) + 1);
  }
  const sharedThumbKeys = new Set(
    [...thumbKeyCounts].filter(([, count]) => count > 1).map(([key]) => key),
  );

  let failures = 0;
  const liveThumbKeys = convexRun("ai/paths/audioTracks:listTopicThumbKeys", {});
  await pool(topics, CONCURRENCY, async (topic) => {
    try {
      await ingestTopic(topic, liveThumbKeys, sharedThumbKeys);
    } catch (err) {
      failures++;
      console.error(`topic ${topic.slug}: FAILED — ${(err as Error).message}`);
    }
  });
  await pool(manifest, CONCURRENCY, async (track) => {
    try {
      await ingestOne(track, sharedThumbKeys);
    } catch (err) {
      failures++;
      console.error(`${track.slug}: FAILED — ${(err as Error).message}`);
    }
  });
  if (failures > 0) process.exit(1);
}

main();
