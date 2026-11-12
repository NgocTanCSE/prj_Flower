import { defineConfig, devices } from '@playwright/test'

/** Cấu hình ghi nhận + runner của Playwright cho smoke e2e (admin + API + health.). */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  outputDir: '.playwright/out',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    headless: true,
    viewport: { width: 1280, height: 720 },
    // những request bị chặn bởi network chỉ farm.
    bypassCSP: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: 'html',
})
