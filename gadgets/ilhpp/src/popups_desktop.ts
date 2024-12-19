import { Resolver } from 'dns';
import { PTR_SHORT_SIDE_LENGTH_PX, PTR_WIDTH_PX, ROOT_CLASS_DESKTOP, DETACH_ANIMATION_MS, DATA_ELEM_SELECTOR, INTERWIKI_A_SELECTOR, PREFETCH_MAX_WAIT, ILH_LANG_SELECTOR } from './consts';
import { PagePreview, getPagePreview } from './network';
import { getDirection, wait } from './utils';

interface LayoutParam {
  cursorPageX: number,
  popupRect: DOMRect,
  anchorRect: DOMRect,
}

interface Layout {
  pageX: number,
  pageY: number,
  isRight: boolean,
  isBottom: boolean,
}

interface Popup {
  elem: HTMLElement,
  anchor: HTMLAnchorElement,
  oldTooltip: string,
  origTitle: string,
  langCode: string,
  langName: string,
  foreignTitle: string,
  foreignHref: string,
  cursorPageX: number,
  abortController: AbortController,
  preview?: Promise<PagePreview>,
}

/**
 * Get real bounding rectangle with CSS applied.
 * @param elem
 * @returns
 */
function getRealRect(elem: HTMLElement): DOMRect {
  const sandbox = document.createElement('div');
  sandbox.style.position = 'absolute';
  sandbox.style.visibility = 'hidden';
  sandbox.style.width = '0px';
  sandbox.style.height = '0px';
  sandbox.appendChild(elem);
  document.body.appendChild(sandbox);

  const result = elem.getBoundingClientRect();

  elem.remove();
  sandbox.remove();

  return result;
}

/**
 * Get the layout of the popup based on its location and size.
 * @param layoutParam
 * @returns
 */
function getLayout(layoutParam: LayoutParam): Layout {
  const pageScrollOffsetX = window.scrollX;
  const pageScrollOffsetY = window.scrollY;
  const viewpointWidth = document.documentElement.clientWidth;
  const viewpointHeight = document.documentElement.clientHeight;

  const width = layoutParam.popupRect.width;
  const height = layoutParam.popupRect.height;

  const anchorPageTop = layoutParam.anchorRect.top + pageScrollOffsetY;
  const anchorPageBottom = layoutParam.anchorRect.bottom + pageScrollOffsetY;

  // X: Right if cursor at left half, left if at right half
  const isRight = layoutParam.cursorPageX < pageScrollOffsetX + viewpointWidth / 2;
  const pageX = isRight
    ? layoutParam.cursorPageX - PTR_SHORT_SIDE_LENGTH_PX
    : layoutParam.cursorPageX - width + PTR_SHORT_SIDE_LENGTH_PX;

  // Y: Bottom if anchor at top half, top if at bottom half
  // This should always align with the current line, so use the anchor's coordinate
  const isBottom = anchorPageTop < pageScrollOffsetY + viewpointHeight / 2;
  const pageY = isBottom
    ? anchorPageBottom + PTR_WIDTH_PX
    : anchorPageTop - height - PTR_WIDTH_PX;

  return { pageX, pageY, isRight, isBottom };
}

function buildPopup(popup: Popup) {
  const root = popup.elem;
  root.className = `${ROOT_CLASS_DESKTOP} ${ROOT_CLASS_DESKTOP}--foreign-${getDirection(popup.langCode)} ${ROOT_CLASS_DESKTOP}--loading`;

  const header = document.createElement('a');
  header.href = popup.foreignHref;
  header.className = `${ROOT_CLASS_DESKTOP}__header`;
  header.lang = popup.langCode;
  header.dir = 'auto';
  header.innerText = popup.foreignTitle;

  const subheader = document.createElement('div');
  subheader.className = `${ROOT_CLASS_DESKTOP}__subheader`;
  subheader.dir = 'auto';
  subheader.innerText = mw.msg('ilhpp-from', popup.langName);

  const main = document.createElement('div');
  main.className = `${ROOT_CLASS_DESKTOP}__main ${ROOT_CLASS_DESKTOP}__main--loading`;

  const extract = document.createElement('a');
  extract.href = popup.foreignHref;
  extract.lang = popup.langCode;
  extract.className = `${ROOT_CLASS_DESKTOP}__main__extract`;
  extract.dir = 'auto';

  const more = document.createElement('a');
  more.href = popup.foreignHref;
  more.className = `${ROOT_CLASS_DESKTOP}__main__more`;
  more.innerText = mw.msg('ilhpp-more');

  main.append(extract, more);

  const cta = document.createElement('div');
  cta.className = `${ROOT_CLASS_DESKTOP}__cta`;

  const ctaInner = document.createElement('div');
  ctaInner.className = `${ROOT_CLASS_DESKTOP}__cta__inner`;
  ctaInner.innerHTML = mw.message('ilhpp-cta', popup.origTitle).parse(); // Safely escaped

  const settingsButton = document.createElement('button');
  settingsButton.className = `${cta.className}__settings`;
  settingsButton.ariaLabel = settingsButton.title = mw.msg('ilhpp-settings');
  settingsButton.addEventListener('click', () => {
    settingsButton.disabled = true;
    // TODO: Load ilhpp-settings
  });

  cta.append(ctaInner, settingsButton);
  root.append(header, subheader, main, cta);

  const rect = getRealRect(root);
  const layout = getLayout({
    popupRect: rect,
    anchorRect: popup.anchor.getBoundingClientRect(),
    cursorPageX: popup.cursorPageX,
  });
  root.style.top = `${layout.pageY}px`;
  root.style.left = `${layout.pageX}px`;

  root.classList.add(`${ROOT_CLASS_DESKTOP}--${layout.isBottom ? 'bottom' : 'top'}`);
  root.classList.add(`${ROOT_CLASS_DESKTOP}--${layout.isRight ? 'right' : 'left'}`);

  if (!layout.isBottom) {
    // Need to change `top` accordingly when size is changed

    // ResizeObserver is not available in Safari < 13.1
    // FIXME: Migrate to that after we raise browser target
    const observer = new MutationObserver(() => {
      // Guaranteed to have only one entry
      const newTop = layout.pageY + rect.height - root.clientHeight;
      root.style.top = `${newTop}px`;

    });
    observer.observe(popup.elem, { subtree: true, childList: true });
  }

  void popup.preview?.then(
    (preview) => {
      root.classList.remove(`${ROOT_CLASS_DESKTOP}--loading`);
      header.innerText = preview.title;

      if (preview.isDisambiguation) {
        root.classList.add(`${ROOT_CLASS_DESKTOP}--disam`);
        extract.removeAttribute('lang'); // This is Chinese now

        extract.innerText = mw.msg('ilhpp-disam');
        more.innerText = mw.msg('ilhpp-disam-more');
      } else {
        root.classList.add(`${ROOT_CLASS_DESKTOP}--standard`);

        extract.innerHTML = preview.mainHtml; // Trust gateway's result as safely escaped
      }
    },
    (err) => {
      // Exclude AbortError to prevent glitches
      if ((err as Error)?.name !== 'AbortError') {
        root.classList.remove(`${ROOT_CLASS_DESKTOP}--loading`);
        root.classList.add(`${ROOT_CLASS_DESKTOP}--error`);
        extract.removeAttribute('lang'); // This is Chinese now

        extract.innerText = mw.msg('ilhpp-error');
        more.innerText = mw.msg('ilhpp-error-more');
      }
    },
  );
}

function createPopup(anchor: HTMLAnchorElement, cursorPageX: number): Popup | null {
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
  const foreignTitle = dataElement.dataset.foreignTitle;

  if (!origTitle || !langCode || !langName || !foreignTitle) {
    return null;
  }

  const oldTooltip = anchor.title;
  anchor.title = ''; // Clear tooltip to prevent "double popups"

  return {
    elem: document.createElement('div'),
    anchor,
    oldTooltip,
    origTitle,
    langCode,
    langName,
    foreignHref,
    foreignTitle,
    cursorPageX,
    abortController: new AbortController(),
    preview: undefined,
  };
}

function attachPopup(popup: Popup) {
  popup.preview = getPagePreview(popup.langCode, popup.foreignTitle, popup.abortController.signal);

  buildPopup(popup);
  document.body.appendChild(popup.elem);
}

async function detachPopup(popup: Popup) {
  popup.abortController.abort();
  popup.elem.classList.add(`${ROOT_CLASS_DESKTOP}--out`);

  await wait(DETACH_ANIMATION_MS);

  popup.elem.remove();
  popup.anchor.title = popup.oldTooltip;
}

export { createPopup, attachPopup, detachPopup, Popup };
