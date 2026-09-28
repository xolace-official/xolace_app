import path from 'node:path';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

const RUN_EVALS = process.env.RUN_EVALS === '1';
const withoutAnthropicKey = (env: Record<string, string>) => {
  if (!RUN_EVALS) delete env.ANTHROPIC_API_KEY;
  return env;
};

export default defineConfig({
  // Mirrors the `@/*` -> `./*` path mapping in tsconfig.json.
  resolve: {
    alias: { '@': path.resolve(process.cwd()) },
  },
  test: {
    // Default runtime. Tests needing convex-test opt in per-file with
    // `// @vitest-environment edge-runtime` as line 1.
    environment: 'node',
    // Explicit so the git worktrees under .claude/ never get collected twice.
    // `test`/`test:coverage` drop `*.eval.test.ts` on top of this; `test:evals`
    // is what runs them.
    include: ['convex/**/*.test.ts', 'src/**/*.test.ts'],
    // Live evals spend Anthropic credits: excluded from every run (local and
    // CI) unless RUN_EVALS=1 opts in — see `test:evals`.
    exclude: [...configDefaults.exclude, ...(RUN_EVALS ? [] : ['**/*.eval.test.ts'])],
    setupFiles: ['./vitest.setup.ts'],
    // edge-runtime workers occasionally race their console.log RPC against
    // worker teardown ("Closing rpc while onUserConsoleLog was pending") —
    // a Vitest/edge-runtime flake unrelated to test correctness. One retry
    // absorbs it in CI.
    retry: process.env.CI ? 1 : 0,
    // `bun test` auto-loaded .env.local; vitest only exposes VITE_-prefixed
    // vars, so the live evals would silently see no ANTHROPIC_API_KEY and
    // no-op. Empty prefix = load everything into process.env.
    // Outside evals the key is dropped, so no test can reach the live API.
    env: withoutAnthropicKey(loadEnv('test', process.cwd(), '')),
    coverage: {
      provider: 'v8',
      include: ['convex/**'],
      reporter: ['text'],
      // Floor set just under the observed baseline at #252 (statements 24.55,
      // branches 23.68, functions 26.92, lines 25.18). Ratchet these up as
      // coverage grows; they exist to catch a drop, not to be aspirational.
      thresholds: {
        statements: 24,
        branches: 23,
        functions: 26,
        lines: 24,
      },
    },
  },
});
