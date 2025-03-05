import { expect, test } from './_setup';
import { LinkMode, PopupMode, OrigLinkColor } from '../src/prefs';

test.use({ currentURL: `file://${import.meta.dirname}/link_regular_ltr.html` });

test.beforeEach(async ({ page }) => {
  await page.evaluate(
    async ([popup, origLinkColor, link]) => {
      document.documentElement.classList.add('skin-theme-clientpref-day');

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
    [PopupMode.OnHover, OrigLinkColor.Green, LinkMode.Orig] as const,
  );

  await page.routeFromHAR(`${import.meta.dirname}/__har__/har.har`, {
    url: /^https:\/\//,
  });
});

test('popup should not appear when mouse jitters over a link', async ({ page }) => {
  const anchor = page.locator('css=.ilh-page a');
  await anchor.hover();
  await page.mouse.move(0, 0);
  await expect(page.locator('css=.ilhpp-popup-desktop')).toHaveCount(0);
});
