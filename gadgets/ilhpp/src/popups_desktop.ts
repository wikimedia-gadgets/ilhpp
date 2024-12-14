import { PTR_SHORT_SIDE_LENGTH_PX, PTR_WIDTH_PX, ROOT_CLASS_DESKTOP, DETACH_ANIMATION_MS, DATA_ELEM_SELECTOR, INTERWIKI_A_SELECTOR, PREFETCH_MAX_WAIT } from './consts';
import { PagePreview, getPagePreview } from './network';
import { wait } from './utils';

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

interface BuildParam {
  origTitle: string,
  langCode: string,
  langName: string,
  foreignTitle: string,
  foreignHref: string,
  anchor: HTMLAnchorElement,
  anchorTooltip: string,
  cursorPageX: number,
  preview: PagePreview | null,
}

interface Popup {
  elem: HTMLElement,
  anchor: HTMLAnchorElement,
  oldTooltip: string,
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
  const pageWidth = document.documentElement.clientWidth;
  const pageHeight = document.documentElement.clientHeight;

  const width = layoutParam.popupRect.width;
  const height = layoutParam.popupRect.height;

  const anchorPageTop = layoutParam.anchorRect.top + pageScrollOffsetY;
  const anchorPageBottom = layoutParam.anchorRect.bottom + pageScrollOffsetY;

  // X: Right if cursor at left half, left if at right half
  const isRight = layoutParam.cursorPageX < pageScrollOffsetX + pageWidth / 2;
  const resultX = isRight
    ? layoutParam.cursorPageX - PTR_SHORT_SIDE_LENGTH_PX
    : layoutParam.cursorPageX - width + PTR_SHORT_SIDE_LENGTH_PX;

  // Y: Bottom if anchor at top half, top if at bottom half
  // This should always align with the current line, so use the anchor's coordinate
  const isBottom = anchorPageTop < pageScrollOffsetY + pageHeight / 2;
  const resultY = isBottom
    ? anchorPageBottom + PTR_WIDTH_PX
    : anchorPageTop - height - PTR_WIDTH_PX;

  return { pageX: resultX, pageY: resultY, isRight, isBottom };
}

function buildPopup(buildParam: BuildParam): Popup {
  const root = document.createElement('div');
  root.className = ROOT_CLASS_DESKTOP;

  const header = document.createElement('div');
  header.className = `${ROOT_CLASS_DESKTOP}__header`;
  header.lang = buildParam.langCode;
  header.dir = 'auto';
  // FIXME: Decide if this is the right choice
  header.innerText = buildParam.preview?.title ?? buildParam.foreignTitle;

  const subheader = document.createElement('div');
  subheader.className = `${ROOT_CLASS_DESKTOP}__subheader`;
  subheader.dir = 'auto';
  subheader.innerText = mw.msg('ilhpp-from', buildParam.langName);

  const extract = document.createElement('a');
  extract.href = buildParam.foreignHref;
  extract.lang = buildParam.langCode;
  extract.className = `${ROOT_CLASS_DESKTOP}__extract`;
  extract.dir = 'auto';
  // FIXME: Display something else than aborted
  extract.innerHTML = buildParam.preview?.mainHtml ?? 'Aborted'; // Trust gateway's result is safely escaped

  const more = document.createElement('a');
  more.href = buildParam.foreignHref;
  more.className = `${extract.className}__more`;
  more.innerText = mw.msg('ilhpp-more');
  extract.appendChild(more);

  const cta = document.createElement('div');
  cta.className = `${ROOT_CLASS_DESKTOP}__cta`;

  const ctaInner = document.createElement('div');
  ctaInner.innerHTML = mw.message('ilhpp-cta', buildParam.origTitle).parse(); // Safely escaped

  const settingsButton = document.createElement('button');
  settingsButton.className = `${cta.className}__settings`;
  settingsButton.ariaLabel = settingsButton.title = mw.msg('ilhpp-settings');

  cta.append(ctaInner, settingsButton);

  root.append(header, subheader, extract, cta);

  const rect = getRealRect(root);
  const layout = getLayout({
    popupRect: rect,
    anchorRect: buildParam.anchor.getBoundingClientRect(),
    cursorPageX: buildParam.cursorPageX,
  });
  root.style.top = `${layout.pageY}px`;
  root.style.left = `${layout.pageX}px`;

  root.classList.add(`${ROOT_CLASS_DESKTOP}--${layout.isBottom ? 'bottom' : 'top'}`);
  root.classList.add(`${ROOT_CLASS_DESKTOP}--${layout.isRight ? 'right' : 'left'}`);

  const result: Popup = {
    elem: root,
    anchor: buildParam.anchor,
    oldTooltip: buildParam.anchorTooltip,
  };

  return result;
}

async function attachPopup(
  anchor: HTMLAnchorElement,
  cursorPageX: number,
  signal?: AbortSignal,
): Promise<Popup | null> {
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
  const langName = dataElement.dataset.langName;
  const foreignTitle = dataElement.dataset.foreignTitle;

  if (!origTitle || !langCode || !langName || !foreignTitle) {
    return null;
  }

  const anchorTooltip = anchor.title;
  anchor.title = ''; // Clear tooltip to prevent "double popups"

  let preview = null;
  try {
    preview = await getPagePreview(langCode, foreignTitle, signal);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // TODO: determine what to do
    }
  }

  const popup = buildPopup({
    origTitle,
    langCode,
    langName,
    foreignHref,
    foreignTitle,
    anchor,
    anchorTooltip,
    cursorPageX,
    preview,
  });

  document.body.appendChild(popup.elem);

  return popup;
}

async function detachPopup(popup: Popup, signal?: AbortSignal) {
  popup.elem.classList.add(`${ROOT_CLASS_DESKTOP}--out`);
  await wait(DETACH_ANIMATION_MS, signal);
  popup.elem.remove();
  popup.anchor.title = popup.oldTooltip;
}

export { attachPopup, detachPopup, Popup };
