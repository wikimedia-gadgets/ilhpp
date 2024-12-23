import { DATA_ELEM_SELECTOR, DETACH_ANIMATION_MS, ILH_LANG_SELECTOR, INTERWIKI_A_SELECTOR, OVERLAY_CLASS_MOBILE, ROOT_CLASS_MOBILE } from './consts';
import { getPagePreview, PagePreview } from './network';
import { getDirection, normalizeTitle, wait } from './utils';

interface Popup {
  overlay: HTMLElement,
  elem: HTMLElement,
  anchor: HTMLAnchorElement,
  origTitle: string,
  langCode: string,
  langName: string,
  foreignTitle: string,
  foreignHref: string,
  abortController: AbortController,
  preview?: Promise<PagePreview>,
}

function buildPopup(popup: Popup) {
  const dir = getDirection(popup.langCode);

  popup.overlay.addEventListener('click', (ev) => {
    if (ev.target === ev.currentTarget) {
      void detachPopup(popup);
    }
  });

  const root = popup.elem;
  root.classList.add(`${ROOT_CLASS_MOBILE}--foreign-${dir}`, `${ROOT_CLASS_MOBILE}--loading`);

  const header = document.createElement('a');
  header.href = popup.foreignHref;
  header.className = `${ROOT_CLASS_MOBILE}__header ilhpp-text-like`;
  header.lang = popup.langCode;
  header.dir = 'auto';
  header.innerText = popup.foreignTitle;

  const subheader = document.createElement('div');
  subheader.className = `${ROOT_CLASS_MOBILE}__subheader`;
  subheader.dir = 'auto';
  subheader.innerText = mw.msg('ilhpp-from', popup.langName);

  const closeButton = document.createElement('button');
  closeButton.className = `${ROOT_CLASS_MOBILE}__close ilhpp-mobile-button`;
  closeButton.ariaLabel = closeButton.title = mw.msg('ilhpp-close');
  closeButton.addEventListener('click', () => {
    void detachPopup(popup);
  });

  const moreButton = document.createElement('a');
  moreButton.role = 'button';
  moreButton.href = popup.foreignHref;
  moreButton.className = `${ROOT_CLASS_MOBILE}__more ilhpp-mobile-button ilhpp-mobile-button--primary-progressive`;
  moreButton.innerText = mw.msg('ilhpp-more');

  const extract = document.createElement('div');
  extract.className = `${ROOT_CLASS_MOBILE}__extract`;

  const extractInner = document.createElement('a');
  extractInner.href = popup.foreignHref;
  extractInner.lang = popup.langCode;
  extractInner.className = `${ROOT_CLASS_MOBILE}__extract__inner ilhpp-text-like`;
  extractInner.dir = 'auto';

  extract.appendChild(extractInner);

  const cta = document.createElement('div');
  cta.className = `${ROOT_CLASS_MOBILE}__cta`;
  cta.innerHTML = mw.message('ilhpp-cta', popup.origTitle).parse(); // Safely escaped

  const settingsButton = document.createElement('button');
  settingsButton.className = `${ROOT_CLASS_MOBILE}__settings ilhpp-mobile-button`;
  settingsButton.ariaLabel = settingsButton.title = mw.msg('ilhpp-settings');
  settingsButton.addEventListener('click', () => {
    settingsButton.disabled = true;
    // TODO: Load ilhpp-settings
  });

  root.append(header, subheader, closeButton, extract, moreButton, cta, settingsButton);

  popup.overlay.append(root);

  void popup.preview?.then(
    (preview) => {
      root.classList.remove(`${ROOT_CLASS_MOBILE}--loading`);
      header.innerText = preview.title;

      if (preview.isDisambiguation) {
        root.classList.add(`${ROOT_CLASS_MOBILE}--disam`);
        extractInner.removeAttribute('lang'); // This is Chinese now

        extractInner.innerText = mw.msg('ilhpp-disam');
        moreButton.innerText = mw.msg('ilhpp-disam-more');
      } else {
        root.classList.add(`${ROOT_CLASS_MOBILE}--standard`);

        extractInner.innerHTML = preview.mainHtml; // Trust gateway's result as safely escaped
      }
    },
    (err) => {
      // Exclude AbortError to prevent glitches
      if ((err as Error)?.name !== 'AbortError') {
        root.classList.remove(`${ROOT_CLASS_MOBILE}--loading`);
        root.classList.add(`${ROOT_CLASS_MOBILE}--error`);
        extractInner.removeAttribute('lang'); // This is Chinese now

        extractInner.innerText = mw.msg('ilhpp-error');
        moreButton.innerText = mw.msg('ilhpp-goto');
      }
    },
  );
}

function createAndAttachPopup(anchor: HTMLAnchorElement): Popup | null {
  const dataElement = anchor.closest<HTMLElement>(DATA_ELEM_SELECTOR);
  if (!dataElement) {
    return null;
  }

  const interwikiAnchor = dataElement.querySelector<HTMLAnchorElement>(INTERWIKI_A_SELECTOR);
  if (!interwikiAnchor) {
    return null;
  }
  const foreignHref = interwikiAnchor.href;

  const origTitle = dataElement.dataset.origTitle;
  const langCode = dataElement.dataset.langCode;
  // `data-lang-name` has incomplete variant conversion, so query from sub-element instead
  const langName = dataElement.querySelector<HTMLElement>(ILH_LANG_SELECTOR)?.innerText;
  let foreignTitle = dataElement.dataset.foreignTitle;

  if (!origTitle || !langCode || !langName || !foreignTitle) {
    return null;
  }

  foreignTitle = normalizeTitle(foreignTitle);

  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASS_MOBILE;

  const elem = document.createElement('div');
  elem.className = ROOT_CLASS_MOBILE;

  const abortController = new AbortController();

  const result: Popup = {
    overlay,
    elem,
    anchor,
    origTitle,
    langCode,
    langName,
    foreignTitle,
    foreignHref,
    abortController,
    preview: getPagePreview(langCode, foreignTitle, abortController.signal),
  };

  buildPopup(result);

  document.body.appendChild(overlay);

  return result;
}

async function detachPopup(popup: Popup) {
  popup.abortController.abort();

  popup.overlay.classList.add(`${OVERLAY_CLASS_MOBILE}--out`);
  popup.elem.classList.add(`${ROOT_CLASS_MOBILE}--out`);

  await wait(DETACH_ANIMATION_MS);

  popup.elem.remove();
  popup.overlay.remove();
}

export { createAndAttachPopup, detachPopup, Popup };
