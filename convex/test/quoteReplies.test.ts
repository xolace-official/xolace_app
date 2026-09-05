// @vitest-environment edge-runtime
/**
 * `dailyQuotes.reply` (#313) — the quote path's first crossing of the
 * metadata-only boundary (docs/adr/0006).
 *
 * What can silently go wrong: a reply landing on someone else's row, the
 * 500-char cap living only in the client, a flagged reply being dropped
 * instead of stored, an `escalation_events` row appearing on a path that was
 * ruled to have no verdict to record — and the wipe/deletion parity that is
 * supposed to be free, which is exactly the kind of freeness worth asserting.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { aggregatesMock } from "./mocks.helpers";
import { asNewUser, type SeededUser } from "./harness.helpers";

const stub = vi.hoisted(() => ({ flagged: false }));

vi.mock("../lib/aggregates", () => aggregatesMock());
vi.mock("../ai/providers/moderation", async (orig) => {
  const actual = await orig<typeof import("../ai/providers/moderation")>();
  return {
    ...actual,
    moderateInput: async () => ({
      flagged: stub.flagged,
      categories: { ...actual.EMPTY_CATEGORIES, "self-harm": stub.flagged },
      categoryScores: {},
    }),
  };
});

async function seedQuote(user: SeededUser) {
  return await user.root.run(async (ctx) =>
    ctx.db.insert("daily_quotes", {
      emotionalProfileId: user.profileId,
      date: "2026-01-01",
      type: "curated" as const,
      text: "the quote",
      isPremium: false,
      createdAt: Date.now(),
    }),
  );
}

const readQuote = (user: SeededUser, quoteId: Awaited<ReturnType<typeof seedQuote>>) =>
  user.root.run(async (ctx) => ctx.db.get("daily_quotes", quoteId));

beforeEach(() => {
  stub.flagged = false;
});

describe("replying to a quote", () => {
  it("stores the reply, trims it, and records that moderation ran", async () => {
    const user = await asNewUser();
    const quoteId = await seedQuote(user);

    const result = await user.t.action(api.dailyQuotes.reply, {
      quoteId,
      text: "  it is the tiredness, not the calm  ",
    });

    expect(result).toEqual({ flagged: false });
    const quote = await readQuote(user, quoteId);
    expect(quote?.reply).toBe("it is the tiredness, not the calm");
    expect(quote?.repliedAt).toBeTypeOf("number");
    expect(quote?.replyModeration?.flagged).toBe(false);
  });

  it("is one reply per quote — sending again overwrites", async () => {
    const user = await asNewUser();
    const quoteId = await seedQuote(user);

    await user.t.action(api.dailyQuotes.reply, { quoteId, text: "first" });
    await user.t.action(api.dailyQuotes.reply, { quoteId, text: "second" });

    expect((await readQuote(user, quoteId))?.reply).toBe("second");
  });

  it("caps at 500 characters and refuses an empty reply, server-side", async () => {
    const user = await asNewUser();
    const quoteId = await seedQuote(user);

    await expect(
      user.t.action(api.dailyQuotes.reply, { quoteId, text: "x".repeat(501) }),
    ).rejects.toThrow();
    await expect(
      user.t.action(api.dailyQuotes.reply, { quoteId, text: "   " }),
    ).rejects.toThrow();

    await user.t.action(api.dailyQuotes.reply, { quoteId, text: "x".repeat(500) });
    expect((await readQuote(user, quoteId))?.reply).toHaveLength(500);
  });

  it("will not write to another user's quote", async () => {
    const owner = await asNewUser();
    const other = await asNewUser(2, owner.root);
    const quoteId = await seedQuote(owner);

    await expect(
      other.t.action(api.dailyQuotes.reply, { quoteId, text: "not mine" }),
    ).rejects.toThrow();
    expect((await readQuote(owner, quoteId))?.reply).toBeUndefined();
  });

  it("stores a flagged reply and opens no escalation event", async () => {
    stub.flagged = true;
    const user = await asNewUser();
    const quoteId = await seedQuote(user);

    const result = await user.t.action(api.dailyQuotes.reply, {
      quoteId,
      text: "i do not want to be here",
    });

    expect(result).toEqual({ flagged: true });
    const quote = await readQuote(user, quoteId);
    // Stored, not dropped — the client answers it with crisis resources.
    expect(quote?.reply).toBe("i do not want to be here");
    expect(quote?.replyModeration?.flagged).toBe(true);
    expect(quote?.replyModeration?.categories).toContain("self-harm");

    const escalations = await user.root.run(async (ctx) =>
      ctx.db.query("escalation_events").collect(),
    );
    expect(escalations).toEqual([]);
  });
});

describe("reply parity with the erasure loops", () => {
  it("goes with the row on a data wipe", async () => {
    const user = await asNewUser();
    const quoteId = await seedQuote(user);
    await user.t.action(api.dailyQuotes.reply, { quoteId, text: "mine" });

    await user.root.mutation(internal.jobs.dataWipe.wipe, {
      emotionalProfileId: user.profileId,
    });

    expect(await readQuote(user, quoteId)).toBeNull();
  });

  it("goes with the row on account deletion", async () => {
    const user = await asNewUser();
    const quoteId = await seedQuote(user);
    await user.t.action(api.dailyQuotes.reply, { quoteId, text: "mine" });

    // Imported here, not at the top: a static import of the deletion steps
    // pulls lib/aggregates in ahead of the hoisted vi.mock above it.
    const { drainQuotes } = await import("../jobs/accountDeletionSteps");
    await user.root.run(async (ctx) => drainQuotes(ctx, user.profileId));

    expect(await readQuote(user, quoteId)).toBeNull();
  });
});
