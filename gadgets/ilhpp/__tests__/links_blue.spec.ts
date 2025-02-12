import { LinkMode, PopupMode, OrigLinkColor } from '../src/prefs';
import { expect, test } from './_setup';
import { getCartesianProduct } from './_utils';

const testCombinations = getCartesianProduct({
  link: Object.values(LinkMode),
  origLinkColor: Object.values(OrigLinkColor),
  highlightExisting: [true, false],
  mwColorClass: [
    'skin-theme-clientpref-day',
    'skin-theme-clientpref-night',
    'skin-theme-clientpref-os',
  ],
  systemColorScheme: ['light', 'dark'] as const,
});

test.use({ currentURL: `file://${import.meta.dirname}/link_blue.html` });

testCombinations.forEach((combination) => {
  test.describe(`given blue link and option ${JSON.stringify(combination)}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: combination.systemColorScheme });
      await page.evaluate(
        async ([combination, popup]) => {
          document.documentElement.classList.add(combination.mwColorClass);

          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { setPreferences } = require('ext.gadget.ilhpp') as {
            setPreferences: typeof import('ext.gadget.ilhpp').setPreferences;
          };
          await setPreferences({
            link: combination.link,
            popup,
            highlightExisting: combination.highlightExisting,
            origLinkColor: combination.origLinkColor,
          });
        },
        [combination, PopupMode.Disabled] as const,
      );
    });

    test('link should have correct appearance', async ({ page }) => {
      await expect(page).toHaveScreenshot();
    });

    test('link should have correct appearance when hovered', async ({ page }) => {
      await page.locator('css=.ilh-page a').hover();
      await expect(page).toHaveScreenshot();
      await page.mouse.move(0, 0); // Reset
    });

    test.fixme('link should have correct appearance after visited', async ({ page }) => {
      const locator = page.locator('css=.ilh-page a');
      await locator.evaluate((node) => {
        node.setAttribute('target', '_blank');
      });
      const waitPromise = page.waitForEvent('popup');
      await page.locator('css=.ilh-page a').click();
      await waitPromise;
      await expect(page).toHaveScreenshot();
    });
  });
});
