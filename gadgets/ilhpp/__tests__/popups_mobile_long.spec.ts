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

test.use({ currentURL: `file://${import.meta.dirname}/link_long.html`, isMobile: true });

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

    test('popup should have correct appearance', async ({ page }) => {
      const requestPromise = page.waitForResponse(/^https:\/\//);
      await page.locator('css=.ilh-page a').click();
      await requestPromise;

      await expect.soft(page.getByText('阅读更多内容')).toBeInViewport();
      await expect(page).toHaveScreenshot();

      await page.getByTitle('关闭').click(); // Reset
      await expect.soft(page.getByText('阅读更多内容')).not.toBeInViewport();
    });
  });
});
