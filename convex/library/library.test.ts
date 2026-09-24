// @vitest-environment edge-runtime
/**
 * Library base reads (#405): single entry with body/source/facets joined,
 * bounded faceted lists, and hubs resolved in editorial order. R2 URL minting
 * (hub audio items) is faked at the `r2` seam, as in test/browse.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { asNewUser, asUnauthed, type SeededUser } from "../test/harness.helpers";
import { aggregatesMock } from "../test/mocks.helpers";

vi.mock("../lib/aggregates", () => aggregatesMock());
vi.mock("../ai/paths/audioTracks", () => ({
  r2: { getUrl: async (key: string) => `https://r2.test/${key}` },
}));
afterEach(() => vi.restoreAllMocks());

type Entry = Omit<Doc<"library_entries">, "_id" | "_creationTime" | "sourceId">;

const entry = (slug: string, extra: Partial<Entry> = {}): Entry => ({
  slug,
  kind: "advice",
  title: `Title ${slug}`,
  dek: `Dek ${slug}`,
  primarySubject: "anxiety",
  reuse: "adapted",
  readMin: 4,
  active: true,
  lastReviewedAt: 1,
  ...extra,
});

/** Seeds one source plus the given entries, each with a body and facets. */
async function seed(
  user: SeededUser,
  rows: { e: Entry; facets?: [string, string][] }[],
) {
  return await user.root.run(async (ctx) => {
    const sourceId = await ctx.db.insert("library_sources", {
      slug: "nhs",
      name: "NHS",
      licence: "OGL v3.0",
      permission: "not_required",
      attributionText: "Contains public sector information licensed under the OGL v3.0",
      dropBrandingIfAdapted: true,
    });
    const ids: Record<string, Id<"library_entries">> = {};
    for (const { e, facets = [] } of rows) {
      const entryId = await ctx.db.insert("library_entries", { ...e, sourceId });
      ids[e.slug] = entryId;
      await ctx.db.insert("library_entry_bodies", { entryId, markdown: `# ${e.slug}` });
      for (const [axis, slug] of facets) {
        await ctx.db.insert("library_entry_facets", { entryId, axis, slug });
      }
    }
    return ids;
  });
}

describe("library.getEntry", () => {
  it("joins body, source and facets, and hides curator-only fields", async () => {
    const user = await asNewUser();
    await seed(user, [
      {
        e: entry("worry", { kind: "explainer", safetyReviewedAt: 5, lastReviewedAt: 9 }),
        facets: [["subject", "anxiety"], ["audience", "student"]],
      },
    ]);

    const got = await user.t.query(api.library.entries.getEntry, { slug: "worry" });
    expect(got).toMatchObject({
      slug: "worry",
      kind: "explainer",
      markdown: "# worry",
      source: { name: "NHS", attributionText: expect.stringContaining("OGL") },
      facets: expect.arrayContaining([
        { axis: "subject", slug: "anxiety" },
        { axis: "audience", slug: "student" },
      ]),
    });
    expect(got).not.toHaveProperty("lastReviewedAt");
    expect(got).not.toHaveProperty("safetyReviewedAt");
    expect(got).not.toHaveProperty("consentRecordedAt");
  });

  it("returns null for an unknown slug", async () => {
    const user = await asNewUser();
    expect(await user.t.query(api.library.entries.getEntry, { slug: "nope" })).toBeNull();
  });

  it("still serves a retracted entry, flagged inactive (#404 read-only access)", async () => {
    const user = await asNewUser();
    await seed(user, [{ e: entry("gone", { active: false }) }]);
    const got = await user.t.query(api.library.entries.getEntry, { slug: "gone" });
    expect(got?.active).toBe(false);
  });

  it("requires sign-in", async () => {
    await expect(asUnauthed().query(api.library.entries.getEntry, { slug: "x" })).rejects.toThrow();
  });
});

describe("library.listEntries", () => {
  it("lists active entries only, filtered by kind", async () => {
    const user = await asNewUser();
    await seed(user, [
      { e: entry("a", { kind: "story" }) },
      { e: entry("b", { kind: "advice" }) },
      { e: entry("c", { kind: "story", active: false }) },
    ]);
    const all = await user.t.query(api.library.entries.listEntries, {});
    expect(all.map((e) => e.slug).sort()).toEqual(["a", "b"]);
    const stories = await user.t.query(api.library.entries.listEntries, { kind: "story" });
    expect(stories.map((e) => e.slug)).toEqual(["a"]);
    expect(stories[0]).not.toHaveProperty("lastReviewedAt");
  });

  it("filters by subject and audience together", async () => {
    const user = await asNewUser();
    await seed(user, [
      { e: entry("both"), facets: [["subject", "exams"], ["audience", "student"]] },
      { e: entry("subjectOnly"), facets: [["subject", "exams"], ["audience", "parent"]] },
      { e: entry("audienceOnly"), facets: [["subject", "grief"], ["audience", "student"]] },
      { e: entry("retired", { active: false }), facets: [["subject", "exams"], ["audience", "student"]] },
    ]);
    const exams = await user.t.query(api.library.entries.listEntries, { subject: "exams" });
    expect(exams.map((e) => e.slug).sort()).toEqual(["both", "subjectOnly"]);
    const both = await user.t.query(api.library.entries.listEntries, { subject: "exams", audience: "student" });
    expect(both.map((e) => e.slug)).toEqual(["both"]);
  });

  it("caps the result at the requested limit", async () => {
    const user = await asNewUser();
    await seed(user, [{ e: entry("a") }, { e: entry("b") }, { e: entry("c") }]);
    expect(await user.t.query(api.library.entries.listEntries, { limit: 2 })).toHaveLength(2);
  });
});

describe("library hubs", () => {
  it("resolves items in editorial order, dropping inactive ones", async () => {
    const user = await asNewUser();
    const ids = await seed(user, [{ e: entry("one") }, { e: entry("two") }, { e: entry("off", { active: false }) }]);
    await user.root.run(async (ctx) => {
      const audioTrackId = await ctx.db.insert("audio_tracks", {
        slug: "calm",
        family: "support",
        title: "Calm",
        topic: "audio_topic_anxiety",
        tags: [],
        sourceTags: [],
        key: "support/calm.m4a",
        thumbKey: "thumb/calm.webp",
        durationSec: 60,
        sha256: "calm",
        thumbSha256: "calm",
        active: true,
        narrators: ["Sage"],
      });
      await ctx.db.insert("library_hubs", {
        slug: "uni",
        title: "Preparing for university",
        intro: "Start here.",
        active: true,
        items: [
          { kind: "entry", entryId: ids.two },
          { kind: "audio", audioTrackId },
          { kind: "entry", entryId: ids.off },
          { kind: "entry", entryId: ids.one },
        ],
      });
      await ctx.db.insert("library_hubs", { slug: "hidden", title: "H", intro: "", active: false, items: [] });
    });

    const hubs = await user.t.query(api.library.hubs.listHubs, {});
    expect(hubs.map((h) => h.slug)).toEqual(["uni"]);

    const hub = await user.t.query(api.library.hubs.getHub, { slug: "uni" });
    expect(hub?.title).toBe("Preparing for university");
    expect(
      hub?.items.map((i) => (i.kind === "entry" ? i.entry.slug : i.track.slug)),
    ).toEqual(["two", "calm", "one"]);

    expect(await user.t.query(api.library.hubs.getHub, { slug: "hidden" })).toBeNull();
  });
});
