import { RTL_LANGS } from './consts';
import { Dir } from './network';

function isMobileDevice(): boolean {
  // Design decision: never be mobile on desktop sites
  // Browser support:
  // Chromium on Samsung devices has "(hover: hover)" set
  // (https://www.ctrl.blog/entry/css-media-hover-samsung.html)
  // So check pointer together
  return !!(mw.config.get('wgMFMode') as string)
    && matchMedia('(hover: none), (pointer: coarse)').matches;
}

function newAbortError(): Error {
  const error = new Error();
  error.name = 'AbortError';
  return error;
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
      return reject(newAbortError());
    }

    const id = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      return reject(newAbortError());
    });
  });
}

function debounce<T extends (...args: any[]) => unknown>(func: T, delay: number): T {
  let id: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: any[]) {
    clearTimeout(id);
    id = setTimeout(() => func.apply(this, args), delay);
  } as T;
}

function throttle<T extends (...args: any[]) => unknown>(func: T, limit: number): T {
  let inThrottle = false;
  return function (this: unknown, ...args: any[]) {
    if (!inThrottle) {
      inThrottle = true;
      func.apply(this, args);
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  } as T;
}

function queueTask(func: (...args: any[]) => unknown) {
  if (queueMicrotask) {
    queueMicrotask(func);
  } else {
    setTimeout(func, 0);
  }
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

class Mutex {
  private lock: Promise<void> = Promise.resolve();

  acquire(): Promise<() => void> {
    let release: () => void;
    const newLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentLock = this.lock;
    this.lock = this.lock.then(() => newLock);
    return currentLock.then(() => release);
  }
}

export {
  isMobileDevice, wait, debounce,
  throttle, queueTask, getDirection,
  normalizeTitle, normalizeLang, isWikipedia,
  Mutex,
};
