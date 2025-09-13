import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
    hookTimeout: 30000,
    teardownTimeout: 30000
  }
});