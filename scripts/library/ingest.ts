// Library catalogue ingestion (#406, decisions in #392).
//
// Upserts `sources.json` → `manifest.json` (entries) → `hubs.json` into the
// `library_*` tables, in that order: entries reference a `sourceSlug`, hubs
// reference entry / kindling-audio slugs that must already be ingested.
// Each entry's body is its own markdown file (`bodyPath`, relative to the
// manifest dir), never inlined.
//
// Idempotent: every record is sent with a sha256 of its manifest JSON (+
// body); the mutation no-ops when it matches the stored one, so re-running
// an unchanged tree writes nothing. Continue-on-error like kindling — a
// rejected record is logged and the run exits 1 at the end.
//
// Hard gates (enforced in convex/library/ingest.ts, the trust boundary):
// a first-hand story (`kind: story`, `reuse: original`) needs
// `consentRecordedAt`; an explainer can only be `active: true` once
// `library/admin:markSafetyReviewed` has signed off its current body. Soft
// gate (#404): a verbatim entry from a source with `refreshDays` (NHS = 7)
// whose `retrievedAt` is older than that prints a refresh nag — it still
// ingests. Unpublishing is `library/admin:setActive`, not this script.
//
// Audio (#411) is a last pass over `audio.json`, keyed by `entrySlug`:
// `[{ entrySlug, audioPath, transcriptPath, active }]`, paths relative to
// `media/` beside the manifest (gitignored, like kindling's). The script
// cuts the free 30s preview itself (ffmpeg) and probes the duration
// (ffprobe), so both need to be on PATH. No `audio.json` → no audio pass.
//
// dev/ (small fixture set) and prod/ (real catalogue) are disjoint trees,
// same convention as scripts/kindling — `--prod` picks both the deployment
// and the prod/ tree.
//
// Usage:
//   bun scripts/library/ingest.ts             # dev deployment + dev/ fixtures
//   bun scripts/library/ingest.ts --prod      # prod deployment + prod/ catalogue
//   bun scripts/library/ingest.ts --manifest scripts/library/dev/manifest.json   # sources/hubs read from the same dir

import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

type Source = { slug: string; refreshDays?: number; [k: string]: unknown };
type Entry = {
  slug: string;
  sourceSlug: string;
  reuse: string;
  retrievedAt?: number;
  bodyPath: string;
  [k: string]: unknown;
};
type Hub = { slug: string; [k: string]: unknown };
type Audio = { entrySlug: string; audioPath: string; transcriptPath: string; active: boolean };

const args = process.argv.slice(2);
const i = args.indexOf("--manifest");
const prod = args.includes("--prod");
const manifestPath = path.resolve(i === -1 ? `scripts/library/${prod ? "prod" : "dev"}/manifest.json` : args[i + 1]);
const dir = path.dirname(manifestPath);
const DAY_MS = 86_400_000;
const PREVIEW_SEC = 30; // the free preview (#390)

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const sha256 = (...parts: string[]) => createHash("sha256").update(parts.join("\u0000")).digest("hex");

function convexRun<T = { action: string }>(fn: string, jsonArgs: unknown): T {
  const out = execFileSync(
    "npx",
    ["convex", "run", fn, JSON.stringify(jsonArgs), ...(prod ? ["--prod"] : [])],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  return JSON.parse(out);
}

let failures = 0;
async function attempt(label: string, fn: () => { action: string } | Promise<{ action: string }>) {
  try {
    console.log(`${label}: ${(await fn()).action}`);
  } catch (err) {
    failures++;
    console.error(`${label}: FAILED — ${(err as Error).message}`);
  }
}

async function upload(key: string, body: Buffer) {
  const { url } = convexRun<{ url: string }>("ai/paths/audioTracks:mintUploadUrl", { key });
  const res = await fetch(url, { method: "PUT", body: new Uint8Array(body), signal: AbortSignal.timeout(10 * 60_000) });
  if (!res.ok) throw new Error(`upload failed (${res.status}): ${key}`);
}

async function ingestAudio(a: Audio) {
  const media = path.join(dir, "media");
  const file = path.resolve(media, a.audioPath);
  const audio = readFileSync(file);
  const transcript = readFileSync(path.resolve(media, a.transcriptPath), "utf8").trim();
  const ext = path.extname(file);
  const durationSec = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }),
  );
  if (!(durationSec > PREVIEW_SEC)) throw new Error(`audio is ${durationSec}s — must be longer than the ${PREVIEW_SEC}s preview`);
  const previewFile = path.join(mkdtempSync(path.join(tmpdir(), "library-audio-")), `preview${ext}`);
  execFileSync("ffmpeg", ["-v", "error", "-i", file, "-t", String(PREVIEW_SEC), "-c", "copy", previewFile]);

  // Fresh keys per attempt; the mutation deletes whichever pair loses.
  const id = randomUUID();
  const key = `library/${a.entrySlug}/${id}${ext}`;
  const previewKey = `library/${a.entrySlug}/${id}.preview${ext}`;
  try {
    await upload(key, audio);
    await upload(previewKey, readFileSync(previewFile));
    return convexRun("library/audio:upsertEntryAudio", {
      audio: {
        entrySlug: a.entrySlug,
        key,
        previewKey,
        durationSec: Math.round(durationSec),
        transcript,
        active: a.active,
        sha256: sha256(createHash("sha256").update(audio).digest("hex"), transcript),
      },
    });
  } catch (err) {
    for (const k of [key, previewKey]) {
      try {
        convexRun("ai/paths/audioTracks:discardUpload", { audioKey: k });
      } catch {
        // best-effort: an orphan blob is harmless
      }
    }
    throw err;
  }
}

async function main() {
  const sources = readJson<Source[]>(path.join(dir, "sources.json"));
  const entries = readJson<Entry[]>(manifestPath);
  const hubs = readJson<Hub[]>(path.join(dir, "hubs.json"));

  if (!prod) execFileSync("npx", ["convex", "dev", "--once"], { stdio: "inherit" });

  for (const source of sources) {
    await attempt(`source ${source.slug}`, () =>
      convexRun("library/ingest:upsertSource", { source, sha256: sha256(JSON.stringify(source)) }),
    );
  }

  const refreshDays = new Map(sources.map((s) => [s.slug, s.refreshDays]));
  for (const record of entries) {
    const days = refreshDays.get(record.sourceSlug);
    if (days && record.reuse === "verbatim" && (record.retrievedAt ?? 0) < Date.now() - days * DAY_MS) {
      console.warn(`entry ${record.slug}: WARNING — verbatim copy older than ${days} days, re-pull it from ${record.sourceSlug}`);
    }
    await attempt(`entry ${record.slug}`, () => {
      const markdown = readFileSync(path.resolve(dir, record.bodyPath), "utf8");
      const { bodyPath: _bodyPath, ...entry } = record;
      return convexRun("library/ingest:upsertEntry", {
        entry,
        markdown,
        sha256: sha256(JSON.stringify(record), markdown),
      });
    });
  }

  for (const hub of hubs) {
    await attempt(`hub ${hub.slug}`, () => convexRun("library/ingest:upsertHub", { hub, sha256: sha256(JSON.stringify(hub)) }));
  }

  const audioPath = path.join(dir, "audio.json");
  for (const a of existsSync(audioPath) ? readJson<Audio[]>(audioPath) : []) {
    await attempt(`audio ${a.entrySlug}`, () => ingestAudio(a));
  }

  if (failures > 0) process.exit(1);
}

main();
