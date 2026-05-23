import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    include: ['e2e/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@bsking/game-engine': path.resolve(__dirname, 'packages/game-engine/src'),
    },
  },
})
