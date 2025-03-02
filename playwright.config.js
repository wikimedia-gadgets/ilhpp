// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Fail the build on CI if accidentally left test.only in the source code.
  retries: process.env.CI ? 2 : undefined, // Opt out of retries on CI
  workers: process.env.CI ? 1 : undefined, // Opt out of parallel tests on CI
  reporter: 'html',

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    trace: 'retain-on-failure',
  },

  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  projects: [
    {
      name: 'Setup ilhpp',
      testDir: './gadgets/ilhpp/__tests__',
      testMatch: /_global_setup\.ts/,
    },
    {
      name: 'Setup ilhpp-settings',
      testDir: './gadgets/ilhpp-settings/__tests__',
      testMatch: /_global_setup\.ts/,
    },
    {
      name: 'Chromium ilhpp',
      testDir: './gadgets/ilhpp/__tests__',
      use: { ...devices['Desktop Chrome'] },
      grep: /(links_|popups_desktop_)/,
      dependencies: ['Setup ilhpp'],
    },
    {
      name: 'Mobile Chrome ilhpp',
      testDir: './gadgets/ilhpp/__tests__',
      use: { ...devices['Pixel 7'] },
      grep: /popups_mobile_/,
      dependencies: ['Setup ilhpp'],
    },
  ],
});
