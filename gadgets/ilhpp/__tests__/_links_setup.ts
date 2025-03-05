import { test as base } from './_setup';

export interface TestFixtures {
  currentURL: string;
  isMobile: boolean;
}

export const test = base.extend<TestFixtures>({
  page: async ({ page }, use) => {
    await page.setViewportSize({ width: 200, height: 50 });
    await use(page);
  },
});

export { expect } from './_setup';
