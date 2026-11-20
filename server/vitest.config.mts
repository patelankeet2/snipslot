import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// On Windows the same folder can be reached as c:\ or C:\. If Vitest sees both
// spellings it loads itself twice and every test fails with "failed to find the
// current suite", so pin the root to an upper case drive letter.
const root = fileURLToPath(new URL('.', import.meta.url)).replace(/^[a-z]:/, (d) =>
  d.toUpperCase(),
);

export default defineConfig({
  root,
  test: {
    environment: 'node',
    // runs before any test file imports the app, so config always sees test values
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    // each file gets its own in-memory MongoDB, which takes a moment to start
    hookTimeout: 60_000,
    testTimeout: 20_000,
    // one file at a time keeps memory use low on small machines and CI runners
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/scripts/**', 'src/types/**'],
      reporter: ['text', 'html'],
    },
  },
});
