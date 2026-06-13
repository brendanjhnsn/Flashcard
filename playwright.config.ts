import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  // Start Vite + Express before tests, shut them down after
  webServer: [
    {
      command: 'npx tsx server/index.ts',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx vite',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
