// @vitest-environment edge-runtime
/**
 * The insights screen's free view (#517). Failure modes: a per-domain number
 * (steadiness, baseline, raw means, readings) reaching the client; the overall
 * dial lighting up before two domains are unlocked; a texture-only user seeing
 * a domain; quiet domains sorted among the live ones or warming ones ahead of
 * them; a quiet domain without the date it was last seen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import { seedMetadata, seedSession } from "../test/fixtures.helpers";
import { asNewUser, type SeededUser } from "../test/harness.helpers";
import { aggregatesMock } from "../test/mocks.helpers";

vi.mock("../lib/aggregates", () => aggregatesMock());

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 8, 12);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

async function seed(user: SeededUser, daysAgo: number, tags: string[], intensity = 5) {
  const at = NOW - daysAgo * DAY;
  const sessionId = await seedSession(user.root, user.profileId, {
    state: "completed",
    confirmationState: "confirmed",
    createdAt: at,
  });
  await seedMetadata(user.root, sessionId, user.profileId, {
    intensity,
    primaryEmotion: "anxiety",
    thematicTags: tags,
    createdAt: at,
  });
}

const read = (user: SeededUser) => user.t.query(api.compounding.insights.freeView, {});

describe("compounding/insights.freeView", () => {
  it("gives a texture-only user no domains and no overall", async () => {
    const user = await asNewUser();
    await seed(user, 0, ["loss", "trauma"]);
    expect(await read(user)).toEqual({ overall: null, domains: [] });
  });

  it("keeps the overall dial dark at one unlocked domain", async () => {
    const user = await asNewUser();
    for (const d of [0, 1, 2]) await seed(user, d, ["work"]);
    await seed(user, 0, ["family"]);
    const out = await read(user);
    expect(out.overall).toBeNull();
    expect(out.domains.map((d) => [d.domain, d.state])).toEqual([
      ["work", "unlocked"],
      ["family", "warming"],
    ]);
  });

  it("shows a rounded overall at two unlocked, and no per-domain number", async () => {
    const user = await asNewUser();
    for (const d of [0, 1, 2]) {
      await seed(user, d, ["work"], 4);
      await seed(user, d, ["sleep"], 7);
    }
    const out = await read(user);
    expect(Number.isInteger(out.overall)).toBe(true);
    expect(out.overall).toBe(Math.round((100 - 300 / 9 + (100 - 600 / 9)) / 2));
    for (const d of out.domains) {
      expect(Object.keys(d).sort()).toEqual(["domain", "lastSeenAt", "state"]);
    }
  });

  it("puts quiet domains after live ones and warming last, with a last-seen date", async () => {
    const user = await asNewUser();
    await seed(user, 0, ["finances"]);
    for (const d of [40, 41, 42]) await seed(user, d, ["family"]);
    for (const d of [0, 1, 2]) await seed(user, d, ["work"]);
    const out = await read(user);
    expect(out.domains).toEqual([
      { domain: "work", state: "unlocked", lastSeenAt: null },
      { domain: "family", state: "unlocked", lastSeenAt: NOW - 40 * DAY },
      { domain: "money", state: "warming", lastSeenAt: null },
    ]);
  });
});
