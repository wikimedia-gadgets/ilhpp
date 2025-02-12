/// <reference types="requirejs" />
import { test as base } from '@playwright/test';
import { getMockupCSS, getMockupJS } from './_utils';

export interface TestFixtures {
  currentURL: string;
  isMobile: boolean;
}

export const test = base.extend<TestFixtures>({
  currentURL: '',
  isMobile: false,
  page: async ({ page, currentURL, isMobile }, use) => {
    await page.goto(currentURL);
    await page.addScriptTag({ content: await getMockupJS() });
    await page.addStyleTag({ content: await getMockupCSS() });

    // Fix flakey tests caused by animations
    await page.emulateMedia({ reducedMotion: 'reduce' });

    if (isMobile) {
      await page.evaluate(() => {
        mw.config.set('wgMFMode', 'active');
        const _oldMatchMedia = window.matchMedia;
        window.matchMedia = function (...args: Parameters<typeof matchMedia>) {
          if (args[0] === '(hover: none), (pointer: coarse)') {
            return { matches: true } as MediaQueryList;
          }
          return _oldMatchMedia(...args);
        };
      });
    }

    await page.addScriptTag({
      path: `${import.meta.dirname}/../../../dist/__tests_DO_NOT_USE__/Gadget-ilhpp.js`,
    });
    await page.addStyleTag({
      path: `${import.meta.dirname}/../../../dist/__tests_DO_NOT_USE__/Gadget-ilhpp.css`,
    });

    await page.evaluate(async () => {
      // Wait for the script to fully load
      await new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require(['ext.gadget.ilhpp'], resolve);
      });
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
