import { MB_SKELETON_STRIPE_COUNT, OVERLAY_CLASS_MOBILE, ROOT_CLASS_MOBILE } from './consts';
import { getPagePreview } from './network';
import { createPopupBase, PopupBase } from './popups';
import { getDirection, isWikipedia, togglePageScroll } from './utils';

interface Popup extends PopupBase {
  overlay: HTMLElement;
  elem: HTMLElement;
  anchor: HTMLAnchorElement;
  abortController: AbortController;
}

function buildPopup(popup: Popup) {
  const dir = getDirection(popup.langCode);

  popup.overlay.className = OVERLAY_CLASS_MOBILE;
  popup.overlay.addEventListener('click', () => {
    void detachPopup(popup);
  });

  const root = popup.elem;
  root.classList.add(
    ROOT_CLASS_MOBILE,
    `${ROOT_CLASS_MOBILE}--foreign-${dir}`,
    `${ROOT_CLASS_MOBILE}--loading`,
  );

  let effectiveTouchInitialState: Touch | null = null;
  let touchOffset: number = 0;
  root.addEventListener('touchstart', (ev) => {
    // Do not respond to touch actions if something is selected
    // This is to prevent "floating selections" bugs found in e.g. iOS Safari
    if (window.getSelection()?.type === 'Range') {
      return;
    }

    popup.overlay.classList.add('ilhpp-mobile-panned');
    root.classList.add('ilhpp-mobile-panned');

    if (!effectiveTouchInitialState) {
      effectiveTouchInitialState = ev.touches[0];
    }
  });
  root.addEventListener('touchmove', (ev) => {
    if (
      window.getSelection()?.type === 'Range' || // Do not respond to touch actions if something is selected
      !effectiveTouchInitialState
    ) {
      return;
    }

    const effectiveTouch = [...ev.changedTouches].find(
      (touch) => touch.identifier === effectiveTouchInitialState!.identifier,
    );
    if (!effectiveTouch) {
      return;
    }

    touchOffset = effectiveTouch.screenY - effectiveTouchInitialState.screenY;
    if (touchOffset >= 0) {
      root.style.transform = `translateY(${touchOffset}px)`;
      popup.overlay.style.opacity = `${1 - touchOffset / root.offsetHeight}`;
    } else {
      // Emulate elastic effect when moving towards the opposite direction
      root.style.transform = `translateY(${Math.expm1(touchOffset / 100) * 20}px)`;
      // Opacity cannot be larger than 1, so simply remove it
      popup.overlay.style.removeProperty('opacity');
    }
  });
  (['touchend', 'touchcancel'] as const).forEach((eventName) => {
    root.addEventListener(eventName, (ev) => {
      // Are there no touches on the popup?
      if (ev.touches.length === 0 && effectiveTouchInitialState) {
        popup.overlay.classList.remove('ilhpp-mobile-panned');
        root.classList.remove('ilhpp-mobile-panned');
        effectiveTouchInitialState = null;

        if (touchOffset / root.offsetHeight > 0.1) {
          // Moved to the lower part of the original popup region, detach it
          // Inline styles are not removed to prevent glitch
          void detachPopup(popup);
        } else {
          // Otherwise, restore to the original state
          popup.overlay.style.removeProperty('opacity');
          root.style.removeProperty('transform');
        }
      }
    });
  });

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

  // Build skeleton stripes as real elements
  // Because mobile popups have variable width, so the SVG mask techniques in desktop popups no longer work
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

          // Do not replace the entire content, this will cause skeletons where touch events originate
          // don't fire the corresponding touchend event, causing visual glitch
          extract.insertAdjacentText('beforeend', mw.msg('ilhpp-no-preview'));
          moreButton.innerText = mw.msg('ilhpp-goto');
          break;

        case 'NotFoundError':
          root.classList.remove(`${ROOT_CLASS_MOBILE}--loading`);
          root.classList.add(`${ROOT_CLASS_MOBILE}--error`);
          extract.removeAttribute('lang'); // This is Chinese now

          // messages.json is trusted
          // Not replacing the entire content for same reasons above
          extract.insertAdjacentHTML(
            'beforeend',
            mw.msg('ilhpp-error-not-found', encodeURIComponent(mw.config.get('wgPageName'))),
          );
          moreButton.innerText = mw.msg('ilhpp-goto');
          break;

        default:
          root.classList.remove(`${ROOT_CLASS_MOBILE}--loading`);
          root.classList.add(`${ROOT_CLASS_MOBILE}--error`);
          extract.removeAttribute('lang'); // This is Chinese now

          // Not replacing the entire content for same reasons above
          extract.insertAdjacentText('beforeend', mw.msg('ilhpp-error'));
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

  // Support Safari 11.1: Partial support is enough for our use case
  // eslint-disable-next-line compat/compat
  const abortController = new AbortController();

  const result: Popup = {
    ...popupBase,
    overlay: document.createElement('div'),
    elem: document.createElement('div'),
    anchor,
    abortController,
  };

  buildPopup(result);

  togglePageScroll(true);
  document.body.append(result.overlay, result.elem);

  return result;
}

async function detachPopup(popup: Popup) {
  popup.abortController.abort();

  popup.overlay.classList.add(`${OVERLAY_CLASS_MOBILE}--out`);
  popup.elem.classList.add(`${ROOT_CLASS_MOBILE}--out`);

  // Wait for the two animations to finish
  await Promise.all(
    [popup.overlay, popup.elem].map((target) =>
      new Promise((resolve) => {
        target.addEventListener('animationend', resolve, { once: true });
      }).then(() => {
        target.remove();
      }),
    ),
  );

  togglePageScroll(false);
}

export { type Popup, attachPopup, detachPopup };
