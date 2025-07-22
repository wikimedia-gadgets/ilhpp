import { DATA_ELEM_SELECTOR, FOREIGN_A_SELECTOR } from './consts';
import { normalizeLang, normalizeTitle, normalizeWikiId } from './utils';

interface PopupBase {
  origTitle: string;
  wikiId: string;
  langCode: string;
  langName: string;
  foreignTitle: string;
  foreignHref: string;
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
  const wikiId = dataElement.dataset.langCode;
  const langCode = wikiId;
  const langName = dataElement.dataset.langName;
  const foreignTitle = dataElement.dataset.foreignTitle;

  if (!origTitle || !wikiId || !langCode || !langName || !foreignTitle) {
    return null;
  }

  return {
    origTitle,
    wikiId: normalizeWikiId(wikiId),
    langCode: normalizeLang(langCode),
    langName,
    foreignTitle: normalizeTitle(foreignTitle),
    foreignHref,
  };
}

export { type PopupBase, createPopupBase };
