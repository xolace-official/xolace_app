// Kindling catalogue ingestion (#328, docs/paths-v1.md §3.4).
//
// Uploads local audio + thumbnail files to R2 and upserts their rows into
// `audio_tracks`. Idempotent — safe to re-run the whole manifest.
//
// Usage:
//   bun scripts/kindling/ingest.ts --update-hashes   # fill in sha256 fields from local files
//   bun scripts/kindling/ingest.ts                    # upload + upsert
//   bun scripts/kindling/ingest.ts --prod             # target the prod deployment/bucket
//   bun scripts/kindling/ingest.ts --manifest scripts/kindling/dev-manifest.json
//
// Drives Convex via the local `convex` CLI (reuses your existing CLI login — no new secret).

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

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

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const prod = args.includes("--prod");
const updateHashes = args.includes("--update-hashes");
const manifestPath = path.resolve(flag("manifest", "scripts/kindling/manifest.json"));
const mediaDir = path.resolve(flag("media", "scripts/kindling/media"));
const CONCURRENCY = 5;

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
  const res = await fetch(url, { method: "PUT", body: readFileSync(filePath) });
  if (!res.ok) throw new Error(`upload failed (${res.status}): ${filePath}`);
}

async function ingestOne(track: ManifestTrack): Promise<void> {
  if (track.family === "support" && (track.tier ?? 0) >= 3 && !track.safetyReviewedAt) {
    throw new Error(`tier ${track.tier} requires safetyReviewedAt`);
  }

  // Thumb before audio (docs/paths-v1.md §3.4 step 2): if the run dies
  // mid-track, a row is never created pointing at a missing thumbnail.
  const thumbKey = `thumb/${track.thumbSha256}.${ext(track.thumbPath)}`;
  const thumbUpload = convexRun("ai/paths/audioTracks:mintUploadUrl", { key: thumbKey });
  await putFile(thumbUpload.url, path.resolve(mediaDir, track.thumbPath));

  const audioKey = `${track.family}/${track.slug}/${randomUUID()}.${ext(track.audioPath)}`;
  const audioUpload = convexRun("ai/paths/audioTracks:mintUploadUrl", { key: audioKey });
  await putFile(audioUpload.url, path.resolve(mediaDir, track.audioPath));

  const { audioPath: _audioPath, thumbPath: _thumbPath, ...rest } = track;
  const result = convexRun("ai/paths/audioTracks:upsertTrack", {
    track: { ...rest, key: audioUpload.key, thumbKey: thumbUpload.key },
  });
  console.log(`${track.slug}: ${result.action}`);
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

  if (updateHashes) {
    for (const track of manifest) {
      track.sha256 = await sha256File(path.resolve(mediaDir, track.audioPath));
      track.thumbSha256 = await sha256File(path.resolve(mediaDir, track.thumbPath));
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Updated hashes for ${manifest.length} tracks in ${manifestPath}`);
    return;
  }

  if (!prod) execFileSync("npx", ["convex", "dev", "--once"], { stdio: "inherit" });

  let failures = 0;
  await pool(manifest, CONCURRENCY, async (track) => {
    try {
      await ingestOne(track);
    } catch (err) {
      failures++;
      console.error(`${track.slug}: FAILED — ${(err as Error).message}`);
    }
  });
  if (failures > 0) process.exit(1);
}

main();
