/**
 * Factories for the Convex *components* the test backend cannot register:
 * `@convex-dev/aggregate`, `@convex-dev/rate-limiter`, `@convex-dev/action-cache`,
 * `@convex-dev/rag`, `@convex-dev/workflow`, posthog (design: issue #242).
 *
 * Each factory returns the module shape `vi.mock` should install. Apply them
 * per test file, top-of-file, never in `vitest.setup.ts` — a file that wants
 * the real module must be able to simply not call the factory:
 *
 * ```ts
 * vi.mock("../lib/aggregates", () => aggregatesMock());
 * // partial: keep the module's real constants, swap only the component
 * vi.mock("../lib/rateLimits", async (orig) => ({
 *   ...(await orig<typeof import("../lib/rateLimits")>()),
 *   ...rateLimiterMock(),
 * }));
 * ```
 *
 * Only mock what the file under test actually reaches. An unused mock is a
 * real code path silently stubbed out.
 */

/** `convex/lib/aggregates` — writes are no-ops; nothing reads ranks back. */
export const aggregatesMock = () => ({
  reflectionRank: {},
  rankInsert: async () => {},
  rankReplace: async () => {},
  rankDelete: async () => {},
});

/**
 * The `rateLimiter` half of `convex/lib/rateLimits` — allow by default. Pass
 * `{ ok: false, retryAfter }` to exercise a rate-limited branch. Spread over
 * the real module so the limit constants stay real.
 */
export const rateLimiterMock = (
  limit: { ok: boolean; retryAfter?: number } = { ok: true },
) => ({
  rateLimiter: {
    limit: async () => limit,
    check: async () => limit,
    reset: async () => {},
  },
});

/** `convex/posthog` — analytics capture is fire-and-forget. */
export const posthogMock = () => ({
  posthog: { capture: async () => {} },
});

// The `ai/cached`, `rag` and workflow factories land with the AI-pipeline
// tests that first reach them — their return shapes are only knowable against
// a real call site, and a guessed one stubs out the thing under test.
