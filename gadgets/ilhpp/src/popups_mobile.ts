import {
  MB_DETACH_ANIMATION_MS,
  MB_SKELETON_STRIPE_COUNT,
  OVERLAY_CLASS_MOBILE,
  ROOT_CLASS_MOBILE,
} from './consts';
import { getPagePreview } from './network';
import { createPopupBase, PopupBase } from './popups';
import { getDirection, isWikipedia, wait } from './utils';

interface Popup extends PopupBase {
  overlay: HTMLElement;
  elem: HTMLElement;
  anchor: HTMLAnchorElement;
  abortController: AbortController;
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
  header.className = `${ROOT_CLASS_MOBILE}__header ilhpp-text-like ilhpp-auto-hyphen`;
  header.lang = popup.langCode;
  header.dir = 'auto';
  header.innerText = popup.foreignTitle;

  const subheader = document.createElement('div');
  subheader.className = `${ROOT_CLASS_MOBILE}__subheader`;
  subheader.dir = 'auto';
  subheader.innerText = mw.msg(
    'ilhpp-from',
    popup.langName,
    isWikipedia(popup.wikiId) ? mw.msg('ilhpp-wp') : '',
  );

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
  extractInner.className = `${ROOT_CLASS_MOBILE}__extract__inner ilhpp-text-like ilhpp-auto-hyphen ilhpp-extract`;
  extractInner.dir = 'auto';

  Array.from({ length: MB_SKELETON_STRIPE_COUNT }).forEach(() => {
    const skeletonStripe = document.createElement('div');
    skeletonStripe.className = 'ilhpp-mobile-skeleton';
    extractInner.appendChild(skeletonStripe);
  });

  extract.appendChild(extractInner);

  const cta = document.createElement('div');
  cta.className = `${ROOT_CLASS_MOBILE}__cta`;

  const ctaInner = document.createElement('div');
  ctaInner.className = `${ROOT_CLASS_MOBILE}__cta__inner`;
  ctaInner.innerHTML = mw.msg('ilhpp-cta', popup.origTitle, encodeURIComponent(popup.origTitle)); // Safely escaped

  cta.append(ctaInner);

  const settingsButton = document.createElement('button');
  settingsButton.className = `${ROOT_CLASS_MOBILE}__settings ilhpp-mobile-button`;
  settingsButton.ariaLabel = settingsButton.title = mw.msg('ilhpp-settings');
  settingsButton.addEventListener('click', () => {
    void (async () => {
      settingsButton.disabled = true;
      const { showSettingsDialog } = await import('ext.gadget.ilhpp-settings');
      await detachPopup(popup);
      showSettingsDialog();
    })();
  });

  root.append(header, subheader, closeButton, extract, moreButton, cta, settingsButton);

  popup.overlay.append(root);

  void getPagePreview(popup.wikiId, popup.foreignTitle, popup.abortController.signal).then(
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
      switch ((err as Error)?.name) {
        case 'AbortError':
          // Exclude AbortError to prevent glitches
          break;

        case 'NotSupportedError':
          root.classList.remove(`${ROOT_CLASS_MOBILE}--loading`);
          root.classList.add(`${ROOT_CLASS_MOBILE}--no-preview`);
          extract.removeAttribute('lang'); // This is Chinese now

          extract.innerText = mw.msg('ilhpp-no-preview');
          moreButton.innerText = mw.msg('ilhpp-goto');
          break;

        case 'NotFoundError':
          root.classList.remove(`${ROOT_CLASS_MOBILE}--loading`);
          root.classList.add(`${ROOT_CLASS_MOBILE}--error`);
          extract.removeAttribute('lang'); // This is Chinese now

          // messages.json is trusted
          extract.innerHTML = mw.msg(
            'ilhpp-error-not-found',
            encodeURIComponent(mw.config.get('wgPageName')),
          );
          moreButton.innerText = mw.msg('ilhpp-goto');
          break;

        default:
          root.classList.remove(`${ROOT_CLASS_MOBILE}--loading`);
          root.classList.add(`${ROOT_CLASS_MOBILE}--error`);
          extract.removeAttribute('lang'); // This is Chinese now

          extract.innerText = mw.msg('ilhpp-error');
          moreButton.innerText = mw.msg('ilhpp-goto');
          break;
      }
    },
  );
}

function attachPopup(anchor: HTMLAnchorElement): Popup | null {
  const popupBase = createPopupBase(anchor);
  if (!popupBase) {
    return null;
  }

  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASS_MOBILE;

  const elem = document.createElement('div');
  elem.className = ROOT_CLASS_MOBILE;

  // Support Safari 11.1: Partial support is enough for our use case
  // eslint-disable-next-line compat/compat
  const abortController = new AbortController();

  const result: Popup = {
    ...popupBase,
    overlay,
    elem,
    anchor,
    abortController,
  };

  buildPopup(result);

  document.body.classList.add('ilhpp-scroll-locked');
  document.body.appendChild(overlay);

  return result;
}

async function detachPopup(popup: Popup) {
  popup.abortController.abort();

  popup.overlay.classList.add(`${OVERLAY_CLASS_MOBILE}--out`);
  popup.elem.classList.add(`${ROOT_CLASS_MOBILE}--out`);

  await wait(MB_DETACH_ANIMATION_MS);

  document.body.classList.remove('ilhpp-scroll-locked');
  popup.elem.remove();
  popup.overlay.remove();
}

export { type Popup, attachPopup, detachPopup };
