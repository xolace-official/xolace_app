/**
 * Row builders for the tables the tier-2 mutation tests write against
 * (design: issue #242). Pairs with `harness.ts`, which owns identity and the
 * `users` / `emotional_profiles` seed.
 *
 * These insert directly via `root.run` on purpose: they exist to produce the
 * *starting* state a mutation is called against, including states no mutation
 * produces. The mutation under test is always the real one.
 *
 * Every builder takes overrides last, so a test names only the fields its
 * assertion depends on.
 */
import type { TestConvex } from "convex-test";
import { expect } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import type schema from "../schema";

type Root = TestConvex<typeof schema>;

/** An `emotional_metadata` row minus the fields the db assigns. */
type StoredMetadata = Omit<
  Doc<"emotional_metadata">,
  "_id" | "_creationTime" | "createdAt"
>;

/**
 * Assert the thrown `ConvexError`'s `data.code`. Never match on messages — a
 * bare `Error` reaches production clients redacted to "Server Error", so the
 * code is the only thing a client can branch on.
 */
export async function expectCode(run: () => Promise<unknown>, code: string) {
  await expect(run()).rejects.toMatchObject({ data: { code } });
}

/** A session owned by `profileId`. Defaults to the state the AI pipeline
 * writes from: `processing`. */
export async function seedSession(
  root: Root,
  profileId: Id<"emotional_profiles">,
  overrides: Partial<Doc<"sessions">> = {},
): Promise<Id<"sessions">> {
  const now = Date.now();
  return await root.run((ctx) =>
    ctx.db.insert("sessions", {
      emotionalProfileId: profileId,
      state: "processing",
      entryType: "open_prompt",
      kept: true,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }),
  );
}

/** An `emotional_metadata` row, as `emotionalMetadata.store` would have
 * written it on an earlier session. */
export async function seedMetadata(
  root: Root,
  sessionId: Id<"sessions">,
  profileId: Id<"emotional_profiles">,
  overrides: Partial<Doc<"emotional_metadata">> = {},
): Promise<Id<"emotional_metadata">> {
  return await root.run((ctx) =>
    ctx.db.insert("emotional_metadata", {
      ...classificationArgs({ sessionId, emotionalProfileId: profileId }),
      createdAt: Date.now(),
      ...overrides,
    }),
  );
}

/** A xolacer conversation for `profileId` — the "already talking to someone"
 * gate in `emotionalMetadata.store`. Self-paired: only `userProfileId` and
 * `status` are read. */
export async function seedConversation(
  root: Root,
  profileId: Id<"emotional_profiles">,
  status: Doc<"xolacer_conversations">["status"] = "open",
): Promise<Id<"xolacer_conversations">> {
  return await root.run((ctx) =>
    ctx.db.insert("xolacer_conversations", {
      userProfileId: profileId,
      xolacerProfileId: profileId,
      status,
      requestedAt: Date.now(),
    }),
  );
}

/**
 * Args for `emotionalMetadata.store`. The default is deliberately a
 * *suggesting* classification — "work" at intensity 8 maps to `burnout` — so
 * a test that expects no suggestion has to say which gate closed it.
 */
export function classificationArgs(
  args: Partial<StoredMetadata> & {
    sessionId: Id<"sessions">;
    emotionalProfileId: Id<"emotional_profiles">;
  },
): StoredMetadata {
  return {
    classifierVersion: "test-v1",
    primaryEmotion: "anxiety",
    primaryEmotionConfidence: 0.8,
    intensity: 8,
    specificity: 0.7,
    thematicTags: ["work"],
    userLanguageTags: ["overwhelmed"],
    riskFlag: false,
    ...args,
  };
}
