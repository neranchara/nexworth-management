import { defineConfig } from 'vitest/config';
import path from 'path';

// Suppress Fastify FSTDEP022 deprecation warning (ignoreTrailingSlash internal access)
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.code === 'FSTDEP022') return;
  console.warn(warning.name, warning.message);
});

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
