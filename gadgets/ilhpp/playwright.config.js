// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './__tests__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Fail the build on CI if accidentally left test.only in the source code.
  retries: process.env.CI ? 2 : undefined, // Opt out of retries on CI
  workers: process.env.CI ? 1 : undefined, // Opt out of parallel tests on CI
  reporter: 'html',
  globalSetup: './__tests__/_global_setup',

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    trace: 'retain-on-failure',
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
