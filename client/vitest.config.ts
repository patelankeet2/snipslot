import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Same Windows fix as the server: c:\ and C:\ must not both be used,
// otherwise Vitest loads itself twice and no test can run.
const root = fileURLToPath(new URL('.', import.meta.url)).replace(/^[a-z]:/, (d) =>
  d.toUpperCase(),
);

// Kept separate from vite.config.ts so the PWA plugin does not run during tests
export default defineConfig({
  root,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/sw.ts', 'src/**/*.d.ts'],
      reporter: ['text', 'html'],
    },
  },
});
