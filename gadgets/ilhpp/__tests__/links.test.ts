/// <reference types="requirejs"/>
import { LinkMode, PopupMode, OrigLinkColor } from '../src/prefs';
import puppeteer from 'puppeteer';
import { beforeAll, describe, expect, inject, test } from 'vitest';
import { getCartesianProduct, getMockupCSS, getMockupJS } from './_utils';

const browserWSEndpoint = inject('browserWsEndpoint');
const browser = await puppeteer.connect({ browserWSEndpoint });
const page = await browser.newPage();
page.on('pageerror', (err) => {
  throw err;
});
page.on('console', (msg) => {
  // eslint-disable-next-line no-console
  console.log('[puppeteer] ', msg.text(), '\n', msg.stackTrace().toString());
});

const testCombinations = getCartesianProduct({
  link: Object.values(LinkMode),
  origLinkColor: Object.values(OrigLinkColor),
  highlightExisting: [true, false],
  mwColorClass: [
    'skin-theme-clientpref-day',
    'skin-theme-clientpref-night',
    'skin-theme-clientpref-os',
  ],
  systemColorScheme: ['light', 'dark'],
});

describe.each(testCombinations)(
  'given %o',
  ({ link, origLinkColor, highlightExisting, mwColorClass, systemColorScheme }) => {
    describe('then for regular link', () => {
      beforeAll(async () => {
        await page.goto(`file://${import.meta.dirname}/link_regular_ltr.html`);

        await page.addScriptTag({ content: await getMockupJS() });
        await page.addStyleTag({ content: await getMockupCSS() });

        await page.addScriptTag({
          path: `${import.meta.dirname}/../../../dist/__tests__/Gadget-ilhpp.js`,
        });
        await page.addStyleTag({
          path: `${import.meta.dirname}/../../../dist/__tests__/Gadget-ilhpp.css`,
        });

        await page.emulateMediaFeatures([
          { name: 'prefers-color-scheme', value: systemColorScheme },
        ]);
        await page.evaluate(
          async (link, popup, origLinkColor, highlightExisting, mwColorClass) => {
            document.documentElement.classList.add(mwColorClass);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            const { setPreferences } = (await new Promise((resolve) => {
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              require(['ext.gadget.ilhpp'], (ilhpp: typeof import('ext.gadget.ilhpp')) => {
                resolve(ilhpp);
              });
            })) as { setPreferences: typeof import('ext.gadget.ilhpp').setPreferences };
            await setPreferences({
              link,
              popup,
              highlightExisting,
              origLinkColor,
            });
          },
          link,
          PopupMode.Disabled,
          origLinkColor,
          highlightExisting,
          mwColorClass,
          systemColorScheme,
        );
      });

      test('internal <a> should have correct style', async () => {
        const internalLinkColor = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector<HTMLAnchorElement>('.ilh-page a')!)
              .color,
        );

        expect(internalLinkColor).toMatchSnapshot();
      });

      test('internal <a> should have correct style when hovered', async () => {
        await page.hover('.ilh-page a');

        const internalLinkColor = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector<HTMLAnchorElement>('.ilh-page a')!)
              .color,
        );

        await page.mouse.move(0, 0); // Reset

        expect(internalLinkColor).toMatchSnapshot();
      });

      test('internal <a> should have correct href', async () => {
        const internalLinkHref = await page.evaluate(
          () => document.querySelector<HTMLAnchorElement>('.ilh-page a')?.href,
        );

        expect(internalLinkHref).toMatchSnapshot();
      });

      test('internal <a> should have correct classes', async () => {
        const internalLinkClassName = await page.evaluate(
          () => document.querySelector<HTMLAnchorElement>('.ilh-page a')?.className,
        );

        expect(internalLinkClassName).toMatchSnapshot();
      });

      test('comment part should have correct visibility', async () => {
        const commentDisplay = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector<HTMLAnchorElement>('.ilh-comment')!)
              .display,
        );

        expect(commentDisplay).toMatchSnapshot();
      });

      test('paren should have correct font size', async () => {
        const parenFontSize = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector<HTMLAnchorElement>('.ilh-paren')!)
              .fontSize,
        );

        expect(parenFontSize).toMatchSnapshot();
      });

      test('lang should have correct visibility', async () => {
        const langDisplay = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector<HTMLAnchorElement>('.ilh-lang')!)
              .display,
        );

        expect(langDisplay).toMatchSnapshot();
      });

      test('lang should have correct font size', async () => {
        const langFontSize = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector<HTMLAnchorElement>('.ilh-lang')!)
              .fontSize,
        );

        expect(langFontSize).toMatchSnapshot();
      });

      test('lang should have correct color', async () => {
        const langColor = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector<HTMLAnchorElement>('.ilh-lang')!).color,
        );

        expect(langColor).toMatchSnapshot();
      });

      test('colon should have correct visibility', async () => {
        const colonDisplay = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector<HTMLAnchorElement>('.ilh-colon')!)
              .display,
        );

        expect(colonDisplay).toMatchSnapshot();
      });

      test('external link should have correct visibility', async () => {
        const externalLinkDisplay = await page.evaluate(
          () =>
            window.getComputedStyle(
              document.querySelector<HTMLAnchorElement>('.ilh-comment .ilh-link')!,
            ).display,
        );

        expect(externalLinkDisplay).toMatchSnapshot();
      });

      test('external link should have correct cursor', async () => {
        const externalLinkCursor = await page.evaluate(
          () =>
            window.getComputedStyle(
              document.querySelector<HTMLAnchorElement>('.ilh-comment .ilh-link')!,
            ).cursor,
        );

        expect(externalLinkCursor).toMatchSnapshot();
      });

      test('external link should have correct pointer events', async () => {
        const externalLinkPointerEvents = await page.evaluate(
          () =>
            window.getComputedStyle(
              document.querySelector<HTMLAnchorElement>('.ilh-comment .ilh-link a.extiw')!,
            ).pointerEvents,
        );

        expect(externalLinkPointerEvents).toMatchSnapshot();
      });
    });
  },
);
