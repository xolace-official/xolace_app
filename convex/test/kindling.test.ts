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
import manifest from "../../scripts/kindling/manifest.json";
import type { WorkflowId } from "@convex-dev/workflow";

type ManifestTrack = Omit<Doc<"audio_tracks">, "_id" | "_creationTime" | "key" | "thumbKey" | "active"> & {
  audioPath: string;
  thumbPath: string;
};

const WHY = "You said the mornings are the hardest, so this is one slow minute before the day starts.";
const twig = (actionType: string, order: number, why = WHY) => ({ actionType, order, why });
const goodReply = JSON.stringify([twig("breathing", 1), twig("xolacer", 2)]);

const stub = vi.hoisted(() => ({
  isPlus: true,
  entitlementThrows: false,
  reply: "" as string,
  limit: { ok: true } as { ok: boolean; retryAfter?: number },
  requests: [] as { messages: { content: unknown }[] }[],
}));

vi.mock("../lib/aggregates", () => aggregatesMock());
vi.mock("../posthog", () => posthogMock());
vi.mock("../rag", () => ragMock());
vi.mock("../lib/rateLimits", async (orig) => ({
  ...(await orig<typeof import("../lib/rateLimits")>()),
  ...rateLimiterMock(() => stub.limit),
}));
vi.mock("../ai/providers/anthropic", async (orig) => {
  const mock = anthropicMock(() => stub.reply);
  return {
    ...(await orig<typeof import("../ai/providers/anthropic")>()),
    getAnthropicClient: () => ({
      messages: {
        create: async (req: { messages: { content: unknown }[] }) => {
          stub.requests.push(req);
          return mock.getAnthropicClient().messages.create();
        },
      },
    }),
  };
});
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
type Sent = { notification: { title?: string; body?: string; data?: unknown } };
const sentPushes = vi.hoisted(() => [] as Sent[]);
vi.mock("../lib/pushNotifications", () => ({
  sendPushToProfile: async (_ctx: unknown, args: Sent) => {
    sentPushes.push(args);
  },
}));

beforeEach(() => {
  stub.isPlus = true;
  stub.entitlementThrows = false;
  stub.reply = goodReply;
  stub.limit = { ok: true };
  stub.requests = [];
  sentPushes.length = 0;
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

/** The checked-in dev catalogue, as `ingest.ts` would have upserted it. */
async function seedCatalogue(user: SeededUser) {
  await user.root.run(async (ctx) => {
    for (const { audioPath, thumbPath, ...t } of manifest as ManifestTrack[]) {
      await ctx.db.insert("audio_tracks", {
        ...t,
        key: audioPath,
        thumbKey: thumbPath,
        active: true,
      } as Doc<"audio_tracks">);
    }
  });
}

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

  it("binds an audio_topic_* twig to a real slug from the dev catalogue", async () => {
    stub.reply = JSON.stringify([twig("audio_topic_anxiety", 1), twig("breathing", 2)]);
    const user = await asNewUser();
    await seedCatalogue(user);
    const sessionId = await seedQualifying(user);

    await generate(user, sessionId);

    const [path] = await readPaths(user);
    const audio = (await readSteps(user, path._id)).find((s) => s.actionType === "audio_topic_anxiety");
    const slugs = manifest.map((t) => t.slug);
    expect(slugs).toContain((audio?.params as { slug: string }).slug);
  });

  it("offers the model only action types that can bind for this session", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);

    await generate(user, sessionId);

    const offered = String(stub.requests[0].messages[0].content);
    expect(offered).toContain("- breathing:");
    expect(offered).toContain("- xolacer:");
    expect(offered).not.toContain("audio_topic_");
    expect(offered).not.toContain("music_topic_");
  });

  it("writes no kindling and no notification when every twig is unbindable", async () => {
    // No catalogue rows and no specialty: only breathing can bind, and the
    // model returns two content twigs anyway.
    stub.reply = JSON.stringify([twig("audio_topic_grief", 1), twig("music_topic_sadness", 2)]);
    const user = await asNewUser();
    const sessionId = await seedSession(user.root, user.profileId, { state: "confirmed" });
    await seedMetadata(user.root, sessionId, user.profileId, { supportNeed: "light" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await generate(user, sessionId);

    expect(await readPaths(user)).toEqual([]);
    const notifications = await user.root.run((ctx) => ctx.db.query("notification_log").take(10));
    expect(notifications).toEqual([]);
    expect(error).toHaveBeenCalledWith(
      "kindling: no-ship",
      expect.objectContaining({ reason: "fewer_than_min_twigs", surviving: 0 }),
    );
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

const readNotifications = (user: SeededUser) =>
  user.root.run((ctx) => ctx.db.query("notification_log").take(10));

describe("the kindling_ready notification (#335)", () => {
  it("fires only after the kindling is written, deep-linking via type alone", async () => {
    const user = await asNewUser();
    await generate(user, await seedQualifying(user));

    const [log] = await readNotifications(user);
    expect(log).toMatchObject({ type: "kindling_ready", delivered: true });
    expect(sentPushes).toHaveLength(1);
    expect(sentPushes[0].notification.data).toMatchObject({ type: "kindling_ready" });
  });

  it("sends nothing when generation no-ships", async () => {
    stub.reply = JSON.stringify([twig("breathing", 1)]);
    const user = await asNewUser();
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generate(user, await seedQualifying(user));

    expect(await readNotifications(user)).toEqual([]);
    expect(sentPushes).toEqual([]);
  });

  it("suppresses for a user dormant 30+ days, logging the existing reason", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    await user.root.run(async (ctx) => {
      await ctx.db.patch("emotional_profiles", user.profileId, {
        lastSessionAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
      });
    });

    await generate(user, sessionId);

    const [log] = await readNotifications(user);
    expect(log).toMatchObject({
      type: "kindling_ready",
      delivered: false,
      suppressedReason: "user_inactive",
    });
    expect(sentPushes).toEqual([]);
  });

  it("suppresses while an escalation-derived follow-up is active", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    await user.root.run(async (ctx) => {
      await ctx.db.insert("follow_up_cards", {
        emotionalProfileId: user.profileId,
        sessionId,
        workflowId: "wf1" as WorkflowId,
        tier: "acute",
        cardText: "still here",
        escalationDerived: true,
        status: "ready",
        createdAt: Date.now(),
      });
    });

    await generate(user, sessionId);

    const [log] = await readNotifications(user);
    expect(log).toMatchObject({
      type: "kindling_ready",
      delivered: false,
      suppressedReason: "escalation_active",
    });
    expect(sentPushes).toEqual([]);
  });

  it("is not starved by the shared notification bucket already being spent today", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    // Spend the shared `notification` bucket, as a gentle_return/pattern_nudge/
    // milestone push earlier the same day would.
    await user.root.mutation(internal.notifications.schedule, {
      emotionalProfileId: user.profileId,
      type: "milestone",
      content: "30 days",
      triggerReason: "test",
      scheduledFor: Date.now(),
    });
    sentPushes.length = 0;

    await generate(user, sessionId);

    const logs = await readNotifications(user);
    const kindlingLog = logs.find((l) => l.type === "kindling_ready");
    expect(kindlingLog).toMatchObject({ delivered: true });
    expect(sentPushes).toHaveLength(1);
  });

  it("does not suppress for a resolved (non-active) follow-up card", async () => {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    await user.root.run(async (ctx) => {
      await ctx.db.insert("follow_up_cards", {
        emotionalProfileId: user.profileId,
        sessionId,
        workflowId: "wf2" as WorkflowId,
        tier: "acute",
        cardText: "still here",
        escalationDerived: true,
        status: "resolved",
        createdAt: Date.now(),
        resolvedAt: Date.now(),
      });
    });

    await generate(user, sessionId);

    const [log] = await readNotifications(user);
    expect(log).toMatchObject({ type: "kindling_ready", delivered: true });
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

describe("the active-kindling screen API (#333)", () => {
  /** A Plus user with one active kindling of [breathing, xolacer]. */
  async function withKindling() {
    const user = await asNewUser();
    const sessionId = await seedQualifying(user);
    await generate(user, sessionId);
    const active = await user.t.query(api.paths.getActive, {});
    if (!active) throw new Error("expected an active kindling");
    return { user, sessionId, active };
  }

  it("getActive returns the twigs in suggested order, and null when there is none", async () => {
    const user = await asNewUser();
    expect(await user.t.query(api.paths.getActive, {})).toBeNull();

    const sessionId = await seedQualifying(user);
    await generate(user, sessionId);

    const active = await user.t.query(api.paths.getActive, {});
    expect(active?.sessionId).toBe(sessionId);
    expect(active?.twigs.map((t) => [t.order, t.kind, t.state])).toEqual([
      [1, "breathing", "pending"],
      [2, "xolacer", "pending"],
    ]);
  });

  it("getActive is null for a free user even when a kindling row exists", async () => {
    const { user } = await withKindling();
    stub.isPlus = false;
    expect(await user.t.query(api.paths.getActive, {})).toBeNull();
  });

  it("resolves a bound track's title onto an audio twig", async () => {
    stub.reply = JSON.stringify([twig("audio_topic_anxiety", 1), twig("breathing", 2)]);
    const user = await asNewUser();
    await seedCatalogue(user);
    await generate(user, await seedQualifying(user));

    const active = await user.t.query(api.paths.getActive, {});
    const audio = active?.twigs.find((t) => t.kind === "audio");
    expect(audio?.title).toBe(
      manifest.find((t) => t.slug === (audio?.params as { slug: string }).slug)?.title,
    );
  });

  it("skipStep and completeStep are independent of order and close the kindling once nothing is pending", async () => {
    const { user, active } = await withKindling();
    const [breathing, xolacer] = active.twigs;

    await user.t.mutation(api.paths.skipStep, { stepId: xolacer._id });
    let now = await user.t.query(api.paths.getActive, {});
    expect(now?.twigs.map((t) => t.state)).toEqual(["pending", "skipped"]);

    await user.t.mutation(api.paths.completeStep, { stepId: breathing._id });
    now = await user.t.query(api.paths.getActive, {});
    expect(now).toBeNull();
    const [path] = await readPaths(user);
    expect(path.status).toBe("completed");
  });

  it("dismiss closes the kindling and leaves the twigs as they were", async () => {
    const { user, active } = await withKindling();
    await user.t.mutation(api.paths.dismiss, { pathId: active._id });

    expect(await user.t.query(api.paths.getActive, {})).toBeNull();
    const [path] = await readPaths(user);
    expect(path.status).toBe("dismissed");
    expect((await readSteps(user, path._id)).every((s) => s.state === "pending")).toBe(true);
  });

  it("another user cannot touch my twigs", async () => {
    const { user, active } = await withKindling();
    const other = await asNewUser(2, user.root);

    await expect(
      other.t.mutation(api.paths.skipStep, { stepId: active.twigs[0]._id }),
    ).rejects.toThrow();
    await expect(other.t.mutation(api.paths.dismiss, { pathId: active._id })).rejects.toThrow();
  });
});

describe("stale kindling screens", () => {
  it("refuses twig writes once the kindling is dismissed", async () => {
    const user = await asNewUser();
    await generate(user, await seedQualifying(user));
    const active = await user.t.query(api.paths.getActive, {});
    if (!active) throw new Error("expected an active kindling");
    await user.t.mutation(api.paths.dismiss, { pathId: active._id });

    await expect(
      user.t.mutation(api.paths.skipStep, { stepId: active.twigs[0]._id }),
    ).rejects.toThrow();
  });
});
