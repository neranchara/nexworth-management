import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    silent: true,
    alias: {
      '@nexworth/database': path.resolve(__dirname, '../../packages/database/index.ts'),
      '@nexworth/ai-engine': path.resolve(__dirname, '../../packages/ai-engine/src/index.ts'),
    },
  },
});
