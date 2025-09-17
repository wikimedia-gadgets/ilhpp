import { DATA_ELEM_SELECTOR, ILH_LANG_SELECTOR, FOREIGN_A_SELECTOR } from './consts';
import { buildWikiUrl, normalizeLang, normalizeTitle, normalizeWikiId } from './utils';

interface LinkData {
  origTitle: string;
  wikiId: string;
  langCode: string;
  langName: string;
  foreignTitle: string;
  foreignHref: string;
}

function extractLinkData(anchor: HTMLAnchorElement): LinkData | null {
  const dataElement = anchor.closest<HTMLElement>(DATA_ELEM_SELECTOR);
  if (!dataElement) {
    return null;
  }

  const origTitle = dataElement.dataset.origTitle;

  const dataElemLangCode = dataElement.dataset.langCode;
  const wikiId = dataElemLangCode === undefined ? undefined : normalizeWikiId(dataElemLangCode);
  const langCode = dataElemLangCode === undefined ? undefined : normalizeLang(dataElemLangCode);
  // `data-lang-name` has incomplete variant conversion, so query from sub-element instead
  const langName = dataElement.querySelector<HTMLElement>(ILH_LANG_SELECTOR)?.innerText;

  const dataElemForeignTitle = dataElement.dataset.foreignTitle;
  const foreignTitle =
    dataElemForeignTitle === undefined
      ? dataElemForeignTitle
      : normalizeTitle(dataElemForeignTitle);

  if (
    !origTitle ||
    !wikiId ||
    !/^[\w.-]+$/.test(wikiId) ||
    !langCode ||
    !langName ||
    !foreignTitle
  ) {
    return null;
  }

  const foreignAnchor = dataElement.querySelector<HTMLAnchorElement>(FOREIGN_A_SELECTOR);
  // Extract always-correct URL from DOM if possible, falling back to crafted URLs
  const foreignHref = foreignAnchor?.href ?? buildWikiUrl(wikiId, `/wiki/${foreignTitle}`);

  return {
    origTitle,
    wikiId,
    langCode,
    langName,
    foreignTitle,
    foreignHref,
  };
}

export { type LinkData, extractLinkData };
