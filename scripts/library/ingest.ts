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
// Audio attachments are a separate follow-up pass, not built here.
//
// dev/ (small fixture set) and prod/ (real catalogue) are disjoint trees,
// same convention as scripts/kindling — `--prod` picks both the deployment
// and the prod/ tree.
//
// Usage:
//   bun scripts/library/ingest.ts             # dev deployment + dev/ fixtures
//   bun scripts/library/ingest.ts --prod      # prod deployment + prod/ catalogue
//   bun scripts/library/ingest.ts --manifest scripts/library/dev/manifest.json   # sources/hubs read from the same dir

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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

const args = process.argv.slice(2);
const i = args.indexOf("--manifest");
const prod = args.includes("--prod");
const manifestPath = path.resolve(i === -1 ? `scripts/library/${prod ? "prod" : "dev"}/manifest.json` : args[i + 1]);
const dir = path.dirname(manifestPath);
const DAY_MS = 86_400_000;

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const sha256 = (...parts: string[]) => createHash("sha256").update(parts.join("\u0000")).digest("hex");

function convexRun(fn: string, jsonArgs: unknown): { action: string } {
  const out = execFileSync(
    "npx",
    ["convex", "run", fn, JSON.stringify(jsonArgs), ...(prod ? ["--prod"] : [])],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  return JSON.parse(out);
}

let failures = 0;
function attempt(label: string, fn: () => { action: string }) {
  try {
    console.log(`${label}: ${fn().action}`);
  } catch (err) {
    failures++;
    console.error(`${label}: FAILED — ${(err as Error).message}`);
  }
}

function main() {
  const sources = readJson<Source[]>(path.join(dir, "sources.json"));
  const entries = readJson<Entry[]>(manifestPath);
  const hubs = readJson<Hub[]>(path.join(dir, "hubs.json"));

  if (!prod) execFileSync("npx", ["convex", "dev", "--once"], { stdio: "inherit" });

  for (const source of sources) {
    attempt(`source ${source.slug}`, () =>
      convexRun("library/ingest:upsertSource", { source, sha256: sha256(JSON.stringify(source)) }),
    );
  }

  const refreshDays = new Map(sources.map((s) => [s.slug, s.refreshDays]));
  for (const record of entries) {
    const days = refreshDays.get(record.sourceSlug);
    if (days && record.reuse === "verbatim" && (record.retrievedAt ?? 0) < Date.now() - days * DAY_MS) {
      console.warn(`entry ${record.slug}: WARNING — verbatim copy older than ${days} days, re-pull it from ${record.sourceSlug}`);
    }
    attempt(`entry ${record.slug}`, () => {
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
    attempt(`hub ${hub.slug}`, () => convexRun("library/ingest:upsertHub", { hub, sha256: sha256(JSON.stringify(hub)) }));
  }

  if (failures > 0) process.exit(1);
}

main();
