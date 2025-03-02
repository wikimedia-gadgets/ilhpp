import { expect, test } from './_setup';
import { LinkMode, PopupMode, OrigLinkColor } from '../src/prefs';
import { getCartesianProduct } from './_utils';

const testCombinations = getCartesianProduct({
  mwColorClass: [
    'skin-theme-clientpref-day',
    'skin-theme-clientpref-night',
    'skin-theme-clientpref-os',
  ],
  systemColorScheme: ['light', 'dark'] as const,
});

test.use({ currentURL: `file://${import.meta.dirname}/link_disam_ltr.html` });

testCombinations.forEach((combination) => {
  test.describe(`given ${JSON.stringify(combination)}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: combination.systemColorScheme });

      await page.evaluate(
        async ([combination, popup, origLinkColor, link]) => {
          document.documentElement.classList.add(combination.mwColorClass);

          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { setPreferences } = require('ext.gadget.ilhpp') as {
            setPreferences: typeof import('ext.gadget.ilhpp').setPreferences;
          };
          await setPreferences({
            link,
            popup,
            highlightExisting: false,
            origLinkColor,
          });
        },
        [combination, PopupMode.OnHover, OrigLinkColor.Green, LinkMode.Orig] as const,
      );

      await page.routeFromHAR(`${import.meta.dirname}/__har__/har.har`, {
        url: /^https:\/\//,
      });
    });

    test('popup should have correct appearance and behaviors', async ({ page }) => {
      const requestPromise = page.waitForResponse(/^https:\/\//);
      const anchor = page.locator('css=.ilh-page a');
      await expect(anchor).toHaveAttribute('title');
      await anchor.hover();
      await requestPromise;

      await expect.soft(page.getByText('查看相似页面')).toBeInViewport();
      await expect(anchor).not.toHaveAttribute('title');
      await expect(page).toHaveScreenshot();

      await page.mouse.move(0, 0); // Reset
      await expect.soft(page.getByText('查看相似页面')).not.toBeInViewport();
      await expect(anchor).toHaveAttribute('title');
    });
  });
});
