import path from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

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
    setupFiles: ['./vitest.setup.ts'],
    // `bun test` auto-loaded .env.local; vitest only exposes VITE_-prefixed
    // vars, so the live evals would silently see no ANTHROPIC_API_KEY and
    // no-op. Empty prefix = load everything into process.env.
    env: loadEnv('test', process.cwd(), ''),
    coverage: {
      provider: 'v8',
      include: ['convex/**'],
      reporter: ['text'],
    },
  },
});
