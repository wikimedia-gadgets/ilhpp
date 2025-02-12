// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './__tests__',
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  retries: 2,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './__tests__/_global_setup',

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
  },

  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
      grep: /(links_|popups_desktop_)/,
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
      grep: /popups_mobile_/,
    },
  ],
});
