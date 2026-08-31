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
import type { ClassificationResult } from "../ai/providers/anthropic";
import {
  EMPTY_CATEGORIES,
  type ModerationResult,
} from "../ai/providers/moderation";
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

/**
 * Everything currently on the scheduler, as `{ name, args }` — `name` is the
 * module path plus function name, e.g. `"jobs/reflectionDistiller.js:distill"`.
 *
 * The pipeline tests assert scheduled work at the enqueue boundary rather than
 * running the downstream job: what was enqueued with which arguments is the
 * contract `generateMirror` owns; what the job then does is the job's own test.
 */
export async function scheduledCalls(
  root: Root,
): Promise<{ name: string; args: Record<string, unknown> }[]> {
  const jobs = await root.run((ctx) =>
    ctx.db.system.query("_scheduled_functions").collect(),
  );
  return jobs.map((j) => ({
    // convex-test reports "ai/tts:generateMirrorAudio"; a real deployment
    // reports "ai/tts.js:generateMirrorAudio". Normalise so an assertion
    // reads the same either way.
    name: j.name.replace(".js:", ":"),
    args: (j.args[0] ?? {}) as Record<string, unknown>,
  }));
}

/** The one scheduled call whose name ends in `suffix`, or undefined. */
export const scheduled = (
  calls: { name: string; args: Record<string, unknown> }[],
  suffix: string,
) => calls.find((c) => c.name.endsWith(suffix));

/** A `ClassificationResult` as the classifier would have returned it. The
 * default is unremarkable — low intensity, no distress emotion — so a test
 * that expects a safeguard level has to say which field produced it. */
export function classificationResult(
  overrides: Partial<ClassificationResult> = {},
): ClassificationResult {
  return {
    primaryEmotion: "anxiety",
    primaryEmotionConfidence: 0.8,
    intensity: 5,
    specificity: 7,
    thematicTags: ["work"],
    userLanguageTags: ["stretched thin"],
    requiresFollowUp: false,
    ...overrides,
  };
}

/** A `ModerationResult`. Defaults to the clean verdict; pass `categories` /
 * `categoryScores` overrides to steer the safeguard engine. */
export function moderationResult(
  overrides: {
    flagged?: boolean;
    categories?: Partial<ModerationResult["categories"]>;
    categoryScores?: Record<string, number>;
  } = {},
): ModerationResult {
  return {
    flagged: overrides.flagged ?? false,
    categories: { ...EMPTY_CATEGORIES, ...overrides.categories },
    categoryScores: overrides.categoryScores ?? {},
  };
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
