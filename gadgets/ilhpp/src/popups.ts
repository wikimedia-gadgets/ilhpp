import { DATA_ELEM_SELECTOR, ILH_LANG_SELECTOR, FOREIGN_A_SELECTOR } from './consts';
import { normalizeLang, normalizeTitle } from './utils';

interface PopupBase {
  origTitle: string,
  wikiCode: string,
  langCode: string,
  langName: string,
  foreignTitle: string,
  foreignHref: string,
}

function createPopupBase(anchor: HTMLAnchorElement): PopupBase | null {
  const dataElement = anchor.closest<HTMLElement>(DATA_ELEM_SELECTOR);
  if (!dataElement) {
    return null;
  }

  const foreignAnchor = dataElement.querySelector<HTMLAnchorElement>(FOREIGN_A_SELECTOR);
  if (!foreignAnchor) {
    return null;
  }
  const foreignHref = foreignAnchor.href;

  const origTitle = dataElement.dataset.origTitle;
  const wikiCode = dataElement.dataset.langCode;
  const langCode = wikiCode;
  // `data-lang-name` has incomplete variant conversion, so query from sub-element instead
  const langName = dataElement.querySelector<HTMLElement>(ILH_LANG_SELECTOR)?.innerText;
  const foreignTitle = dataElement.dataset.foreignTitle;

  if (!origTitle || !wikiCode || !langCode || !langName || !foreignTitle) {
    return null;
  }

  return {
    origTitle,
    wikiCode,
    langCode: normalizeLang(langCode),
    langName,
    foreignTitle: normalizeTitle(foreignTitle),
    foreignHref,
  };
}

export { type PopupBase, createPopupBase };
