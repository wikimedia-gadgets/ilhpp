import { test as base } from '@playwright/test';
import { getMockupCSS, getMockupJS } from './_utils';

export interface TestFixtures {
  currentURL: string;
}

export const test = base.extend<TestFixtures>({
  currentURL: ['', { option: true }],
  page: async ({ page, currentURL }, use) => {
    await page.goto(currentURL);
    await page.addScriptTag({ content: await getMockupJS() });
    await page.addStyleTag({ content: await getMockupCSS() });

    await page.addScriptTag({
      path: `${import.meta.dirname}/../../../dist/__tests_DO_NOT_USE__/Gadget-ilhpp.js`,
    });
    await page.addStyleTag({
      path: `${import.meta.dirname}/../../../dist/__tests_DO_NOT_USE__/Gadget-ilhpp.css`,
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
