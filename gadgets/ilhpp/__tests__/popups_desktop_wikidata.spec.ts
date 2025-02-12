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

test.use({ currentURL: `file://${import.meta.dirname}/link_wikidata.html` });

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
    });

    test('popup should have correct appearance and behaviors', async ({ page }) => {
      const anchor = page.locator('css=.ilh-page a');
      await expect(anchor).toHaveAttribute('title');
      await anchor.hover();

      await expect(page.getByText('前往该页面')).toBeVisible();
      await expect(anchor).not.toHaveAttribute('title');
      await expect(page).toHaveScreenshot();

      await page.mouse.move(0, 0); // Reset
      await expect(page.getByText('前往该页面')).not.toBeVisible();
      await expect(anchor).toHaveAttribute('title');
    });
  });
});
