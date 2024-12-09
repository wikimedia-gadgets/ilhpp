import { DATA_ELEM_SELECTOR, DETACH_DELAY_MS, FETCH_START_DELAY_MS } from './consts';
import { isMobileDevice, wait } from './utils';
import { buildPopup as buildPopupDesktop, detachPopup as detachPopupDesktop } from './popup_desktop';
import { buildPopup as buildPopupMobile, detachPopup as detachPopupMobile } from './popup_mobile';

interface Popup {
  elem: HTMLElement,
  anchor: HTMLAnchorElement,
  oldTitle: string,
}

interface BuildParam {
  origArticle: string,
  langCode: string,
  langName: string,
  foreignArticle: string,
  cursorX: number,
  cursorY: number,
  title: string,
  anchor: HTMLAnchorElement,
}

async function attachPopup(
  anchor: HTMLAnchorElement,
  cursorX: number,
  cursorY: number,
): Promise<Popup | null> {
  const dataElement = anchor.closest<HTMLElement>(DATA_ELEM_SELECTOR);
  if (!dataElement) {
    return null;
  }

  // FIXME: stub
  await wait(FETCH_START_DELAY_MS);

  const origTitle = dataElement.dataset.origTitle;
  const langCode = dataElement.dataset.langCode;
  const langName = dataElement.dataset.langName;
  const foreignTitle = dataElement.dataset.foreignTitle;

  if (!origTitle || !langCode || !langName || !foreignTitle) {
    return null;
  }

  const builderFn = isMobileDevice() ? buildPopupMobile : buildPopupDesktop;
  const popup = builderFn({
    origArticle: origTitle,
    langCode,
    langName,
    foreignArticle: foreignTitle,
    cursorX,
    cursorY,
    title: anchor.title,
    anchor,
  });
  document.body.appendChild(popup.elem);

  // Clear tooltip to prevent "double popups"
  anchor.title = '';

  return popup;
}

async function detachPopup(popup: Popup, signal?: AbortSignal) {
  await wait(DETACH_DELAY_MS, signal);

  const detachFn = isMobileDevice() ? detachPopupMobile : detachPopupDesktop;
  void detachFn(popup);
}

export { attachPopup, detachPopup, Popup, BuildParam };
