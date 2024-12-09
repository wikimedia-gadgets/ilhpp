import { PTR_SHORT_SIDE_LENGTH_PX, PAGE_POPUP_PADDING_PX, PTR_WIDTH_PX, ROOT_CLASS_DESKTOP, DETACH_ANIMATION_MS } from './consts';
import { BuildParam, Popup } from './popup';
import { wait } from './utils';

interface LayoutParam {
  cursorX: number,
  cursorY: number,
  popupRect: DOMRect,
  anchorRect: DOMRect,
}

interface Layout {
  x: number,
  y: number,
  isRight: boolean,
  isBottom: boolean,
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

function getLayout(layoutParam: LayoutParam): Layout {
  const pageX = window.scrollX;
  const pageY = window.scrollY;
  const pageWidth = document.documentElement.clientWidth;
  const pageHeight = document.documentElement.clientHeight;

  const width = layoutParam.popupRect.width;
  const height = layoutParam.popupRect.height;

  const anchorPageTop = layoutParam.anchorRect.top + pageY;
  const anchorPageBottom = layoutParam.anchorRect.bottom + pageY;

  // X: First try right
  let resultX = layoutParam.cursorX - PTR_SHORT_SIDE_LENGTH_PX;
  let isRight = true;
  if (
    resultX < pageX + PAGE_POPUP_PADDING_PX
    || resultX + width > pageX + pageWidth - PAGE_POPUP_PADDING_PX
  ) {
    // Then try left
    resultX = layoutParam.cursorX - width + PTR_SHORT_SIDE_LENGTH_PX;
    isRight = false;
  }

  // Y: First try bottom
  // This should always align with the current line, so use the anchor's coordinate
  let resultY = anchorPageBottom + PTR_WIDTH_PX;
  let isBottom = true;
  if (
    resultY < pageY + PAGE_POPUP_PADDING_PX
    || resultY + height > pageY + pageHeight - PAGE_POPUP_PADDING_PX
  ) {
    // Then try up
    resultY = anchorPageTop - height - PTR_WIDTH_PX;
    isBottom = false;
  }

  return { x: resultX, y: resultY, isRight, isBottom };
}

function buildPopup(buildParam: BuildParam): Popup {
  const root = document.createElement('div');
  root.className = ROOT_CLASS_DESKTOP;

  const header = document.createElement('div');
  header.className = `${ROOT_CLASS_DESKTOP}__header`;
  header.dir = 'auto';
  header.innerText = buildParam.foreignArticle;

  const subheader = document.createElement('div');
  subheader.className = `${ROOT_CLASS_DESKTOP}__subheader`;
  subheader.dir = 'auto';
  subheader.innerText = mw.msg('ilhpp-from', buildParam.langName);

  const extract = document.createElement('a');
  extract.href = `//${buildParam.langCode}.wikipedia.org/wiki/${buildParam.foreignArticle}`;
  extract.className = `${ROOT_CLASS_DESKTOP}__extract`;
  extract.dir = 'auto';
  extract.innerText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ut orci ut libero vestibulum rhoncus vel id urna. Sed malesuada cursus mi sed suscipit. Pellentesque mollis lorem quis lacus vestibulum, ut elementum odio luctus. Aenean non tellus eget sem convallis finibus quis eget purus. Curabitur urna sem, malesuada id justo non, tincidunt efficitur neque. In a vestibulum lorem, eu consequat eros. Donec euismod metus elementum gravida sagittis. Fusce sodales eleifend facilisis. Mauris eget tempus odio, ut sagittis lectus. Donec vitae metus ac urna pretium laoreet sed vitae quam. In in semper tortor, rhoncus posuere erat. ';

  const more = document.createElement('a');
  more.href = extract.href;
  more.className = `${extract.className}__more`;
  more.innerText = mw.msg('ilhpp-more');
  extract.appendChild(more);

  const cta = document.createElement('div');
  cta.className = `${ROOT_CLASS_DESKTOP}__cta`;
  cta.innerHTML = mw.message('ilhpp-cta', buildParam.origArticle).parse(); // Safely escaped

  root.append(header, subheader, extract, cta);

  const rect = getRealRect(root);
  const layout = getLayout({
    popupRect: rect,
    anchorRect: buildParam.anchor.getBoundingClientRect(),
    cursorX: buildParam.cursorX,
    cursorY: buildParam.cursorY,
  });
  root.style.top = `${layout.y}px`;
  root.style.left = `${layout.x}px`;

  root.classList.add(`${ROOT_CLASS_DESKTOP}--${layout.isBottom ? 'bottom' : 'top'}`);
  root.classList.add(`${ROOT_CLASS_DESKTOP}--${layout.isRight ? 'right' : 'left'}`);

  const result: Popup = {
    elem: root,
    anchor: buildParam.anchor,
    oldTitle: buildParam.title,
  };

  /* root.addEventListener('mouseleave', () => {
    void detachPopup(result);
  }); */

  return result;
}

async function detachPopup(popup: Popup) {
  popup.elem.classList.add(`${ROOT_CLASS_DESKTOP}--out`);
  await wait(DETACH_ANIMATION_MS);
  popup.elem.remove();
  popup.anchor.title = popup.oldTitle;
}

export { buildPopup, detachPopup };
