import { NAV_POPUP_OPTION_NAME, RTL_LANGS } from './consts';
import { Dir } from './network';

function isMobileDevice(): boolean {
  // Design decision: never be mobile on desktop sites
  // Browser support:
  // Chromium on Samsung devices has "(hover: hover)" set
  // (https://www.ctrl.blog/entry/css-media-hover-samsung.html)
  // So check pointer together
  return (
    !!(mw.config.get('wgMFMode') as string) &&
    matchMedia('(hover: none), (pointer: coarse)').matches
  );
}

/**
 * Wait for a certain time before resolving. Reject if aborted.
 * @param ms
 * @param signal
 * @returns
 */
function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('The operation was aborted.', 'AbortError'));
    }

    const id = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      return reject(new DOMException('The operation was aborted.', 'AbortError'));
    });
  });
}

// FIXME: Currently use the old method as structuredClone is not widely available
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Get text direction of a language code.
 * @param langCode
 * @returns
 */
function getDirection(langCode: string): Dir {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (Intl.Locale.prototype.getTextInfo || Intl.Locale.prototype.textInfo) {
      const locale = new Intl.Locale(langCode);
      return (locale.getTextInfo() ?? locale.textInfo).direction as Dir;
    }
  } catch {
    return 'ltr'; // Default value
  }

  return RTL_LANGS.includes(langCode.split('-')[0].toLowerCase()) ? 'rtl' : 'ltr';
}

/**
 * Normalize title to displaying format.
 * @param title
 * @returns
 */
function normalizeTitle(title: string): string {
  return title.replace(/_/g, ' ');
}

/**
 * Filter out some invalid lang code provided by HTML, like 'd' which is interwiki code for Wikidata.
 * @param lang
 * @returns
 */
function normalizeLang(lang: string): string {
  return lang === 'd' ? 'en' : lang;
}

function isWikipedia(wikiId: string): boolean {
  return wikiId !== 'd';
}

function haveConflicts(): boolean {
  return String(mw.user.options.get(NAV_POPUP_OPTION_NAME) as number | string) === '1';
}

export {
  isMobileDevice,
  wait,
  deepClone,
  getDirection,
  normalizeTitle,
  normalizeLang,
  isWikipedia,
  haveConflicts,
};
