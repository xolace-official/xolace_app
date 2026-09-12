// @vitest-environment edge-runtime
/**
 * Kindling (#330 / #331, docs/paths-v1.md §2, §5, §6, §7): the trigger, the
 * premium boundary, the model-pick + validation + fallback, the one-active
 * lifecycle, and the cascade. The Haiku reply is faked at the provider seam.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { scheduled, scheduledCalls, seedMetadata, seedSession } from "./fixtures.helpers";
import { asNewUser, type SeededUser } from "./harness.helpers";
import {
  aggregatesMock,
  anthropicMock,
  noopJob,
  posthogMock,
  ragMock,
  rateLimiterMock,
  revenuecatMock,
} from "./mocks.helpers";

const WHY = "You said the mornings are the hardest, so this is one slow minute before the day starts.";
const twig = (actionType: string, order: number, why = WHY) => ({ actionType, order, why });
const goodReply = JSON.stringify([twig("breathing", 1), twig("xolacer", 2)]);

const stub = vi.hoisted(() => ({
  isPlus: true,
  entitlementThrows: false,
  reply: "" as string,
  limit: { ok: true } as { ok: boolean; retryAfter?: number },
}));

vi.mock("../lib/aggregates", () => aggregatesMock());
vi.mock("../posthog", () => posthogMock());
vi.mock("../rag", () => ragMock());
vi.mock("../lib/rateLimits", async (orig) => ({
  ...(await orig<typeof import("../lib/rateLimits")>()),
  ...rateLimiterMock(() => stub.limit),
}));
vi.mock("../ai/providers/anthropic", async (orig) => ({
  ...(await orig<typeof import("../ai/providers/anthropic")>()),
  ...anthropicMock(() => stub.reply),
}));
vi.mock("../revenuecat", () =>
  revenuecatMock(() => {
    if (stub.entitlementThrows) throw new Error("RC down");
    return stub.isPlus;
  }),
);
// Sibling jobs `finalizeCompletion` enqueues — neutered so a job firing after
// the test body can't reach an unregistered component.
vi.mock("../jobs/profileStats", () => ({ updateAfterSession: noopJob() }));
vi.mock("../ai/reflectionAgent/trigger", () => ({ onSessionComplete: noopJob() }));
vi.mock("../followUps", async (orig) => ({
  ...(await orig<typeof import("../followUps")>()),
  startFollowUpWorkflow: noopJob(),
  purgeForProfile: noopJob(),
}));

beforeEach(() => {
  stub.isPlus = true;
  stub.entitlementThrows = false;
  stub.reply = goodReply;
  stub.limit = { ok: true };
});
afterEach(() => vi.restoreAllMocks());

type SupportNeed = NonNullable<Doc<"emotional_metadata">["supportNeed"]>;

/** A confirmed session with its Understanding, ready for `completeSession`. */
async function seedQualifying(
  user: SeededUser,
  supportNeed: SupportNeed = "light",
): Promise<Id<"sessions">> {
  const sessionId = await seedSession(user.root, user.profileId, { state: "confirmed" });
  await seedMetadata(user.root, sessionId, user.profileId, {
    supportNeed,
    suggestedSpecialty: "burnout",
  });
  return sessionId;
}

const generate = (user: SeededUser, sessionId: Id<"sessions">) =>
  user.root.action(internal.ai.paths.generate.run, {
    sessionId,
    emotionalProfileId: user.profileId,
  });

const readPaths = (user: SeededUser) =>
  user.root.run((ctx) =>
    ctx.db
      .query("paths")
      .withIndex("by_profile_and_status", (q) =>
        q.eq("emotionalProfileId", user.profileId),
      )
      .collect(),
  );

const readSteps = (user: SeededUser, pathId: Id<"paths">) =>
  user.root.run((ctx) =>
    ctx.db
      .query("path_steps")
      .withIndex("by_path", (q) => q.eq("pathId", pathId))
      .collect(),
  );

describe("ai/paths/generate.run", () => {
  it("writes one active kindling with 2–3 pending twigs for a Plus user", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user, "light");

    await generate(user, sessionId);

    const [path, ...rest] = await readPaths(user);
    expect(rest).toEqual([]);
    expect(path).toMatchObject({ sessionId, status: "active" });
    const steps = await readSteps(user, path._id);
    expect(steps.length).toBeGreaterThanOrEqual(2);
    expect(steps.length).toBeLessThanOrEqual(3);
    expect(steps.every((s) => s.state === "pending")).toBe(true);
    expect(steps.map((s) => s.actionType).sort()).toEqual(["breathing", "xolacer"]);
    expect(steps.find((s) => s.actionType === "xolacer")?.params).toEqual({ specialty: "burnout" });
    expect(path.modelVersion).toBe("paths-v1-haiku-4.5");
  });

  it("drops a twig whose why fails validation and ships the rest", async () => {
    stub.reply = JSON.stringify([
      twig("breathing", 1, "You mentioned anxiety, so this helps you cope and regulate for a minute."),
      twig("breathing", 2),
      twig("xolacer", 3),
    ]);
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await generate(user, sessionId);

    const [path] = await readPaths(user);
    const steps = await readSteps(user, path._id);
    expect(steps.map((s) => [s.actionType, s.order])).toEqual([
      ["breathing", 1],
      ["xolacer", 2],
    ]);
    expect(error).toHaveBeenCalledWith(
      "kindling: twig dropped",
      expect.objectContaining({ actionType: "breathing", reason: "why_vocabulary" }),
    );
  });

  it("writes no paths row when fewer than 2 twigs survive", async () => {
    stub.reply = JSON.stringify([twig("breathing", 1), twig("not_a_key", 2)]);
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await generate(user, sessionId);

    expect(await readPaths(user)).toEqual([]);
    expect(error).toHaveBeenCalledWith(
      "kindling: no-ship",
      expect.objectContaining({ reason: "fewer_than_min_twigs", surviving: 1 }),
    );
  });

  it("writes nothing when the per-profile rate limit is spent", async () => {
    stub.limit = { ok: false, retryAfter: 1000 };
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generate(user, sessionId);

    expect(await readPaths(user)).toEqual([]);
  });

  it("still generates on a cold start with no semantic profile", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);

    await generate(user, sessionId);

    const [path] = await readPaths(user);
    expect(path.status).toBe("active");
    expect(path.emotionalProfileVersionId).toBeUndefined();
  });

  it("writes nothing for a free user", async () => {
    stub.isPlus = false;
    const user = await asNewUser();
    const sessionId = await seedQualifying(user, "active");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await generate(user, sessionId);

    expect(await readPaths(user)).toEqual([]);
    expect(error).not.toHaveBeenCalled();
  });

  it("writes nothing when supportNeed is none", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user, "none");

    await generate(user, sessionId);

    expect(await readPaths(user)).toEqual([]);
  });

  it("swallows and logs a thrown error; nothing is written", async () => {
    stub.entitlementThrows = true;
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generate(user, sessionId)).resolves.toBeNull();

    expect(error).toHaveBeenCalled();
    expect(await readPaths(user)).toEqual([]);
  });

  it("flips the previous active kindling to replaced, keeping its row", async () => {
    const user = await asNewUser();
    const first = await seedQualifying(user);
    await generate(user, first);
    const second = await seedQualifying(user);

    await generate(user, second);

    const paths = await readPaths(user);
    expect(paths.map((p) => [p.sessionId, p.status])).toEqual(
      expect.arrayContaining([
        [first, "replaced"],
        [second, "active"],
      ]),
    );
    expect(paths.filter((p) => p.status === "active")).toHaveLength(1);
  });
});

describe("the completion hook", () => {
  it("fires from completeSession", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);

    await user.t.mutation(api.sessions.completeSession, { sessionId });

    const call = scheduled(await scheduledCalls(user.root), "ai/paths/generate:run");
    expect(call?.args).toEqual({ sessionId, emotionalProfileId: user.profileId });
  });

  it("does not fire from completePath", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);

    await user.t.mutation(api.sessions.completePath, { sessionId, pathCompleted: true });

    const call = scheduled(await scheduledCalls(user.root), "ai/paths/generate:run");
    expect(call).toBeUndefined();
  });
});

describe("cascade", () => {
  it("dataWipe deletes path_steps by path, then the paths row", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    await generate(user, sessionId);
    const [path] = await readPaths(user);
    expect(await readSteps(user, path._id)).not.toEqual([]);

    await user.root.mutation(internal.jobs.dataWipe.wipe, {
      emotionalProfileId: user.profileId,
    });

    expect(await readPaths(user)).toEqual([]);
    expect(await readSteps(user, path._id)).toEqual([]);
  });
});
