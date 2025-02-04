// import { API_USER_AGENT } from './consts';

const hostRest = location.hostname.endsWith('wmflabs.org')
  ? '.wikipedia.beta.wmflabs.org'
  : '.wikipedia.org';

async function getPagePreview(
  wikiId: string,
  title: string,
  signal?: AbortSignal,
): Promise<PagePreview> {
  if (wikiId === 'd') {
    // No preview
    throw new DOMException('No preview for this wiki', 'NotSupportedError');
  }

  const resp = await fetch(
    `https://${wikiId}${hostRest}/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    {
      signal,
      // Design decision: we want to minimize loading time as much as possible as it introduces
      // visual glitches, so uses cache if present regardless of its freshness
      cache: 'force-cache',
      // FIXME: Need workaround, adding this causes CORS preflight requests
      /* headers: {
        'Api-User-Agent': API_USER_AGENT,
      }, */
    },
  );

  if (resp.status === 404) {
    throw new DOMException('Page not found', 'NotFoundError');
  }
  if (!resp.ok) {
    throw new DOMException('Invalid response', 'InvalidStateError');
  }

  const respJson = (await resp.json()) as SummaryApiResponse;

  if (!respJson.extract_html) {
    throw new DOMException('No preview for this page', 'NotSupportedError');
  }

  // `displaytitle` may contain HTML tags, so strip them
  const temp = document.createElement('div');
  temp.innerHTML = respJson.displaytitle;
  const displayTitle = temp.textContent ?? ''; // `innerText` is slow

  return {
    isDisambiguation: respJson.type === 'disambiguation',
    title: displayTitle,
    dir: respJson.dir,
    description: respJson.description,
    mainHtml: respJson.extract_html,
  };
}

type Dir = 'ltr' | 'rtl';

interface SummaryApiResponse {
  type: 'standard' | 'disambiguation';
  displaytitle: string;
  dir: Dir;
  description: string;
  extract_html: string;
}

interface PagePreview {
  isDisambiguation: boolean;
  title: string;
  dir: Dir;
  description: string;
  mainHtml: string;
}

export { type Dir, type PagePreview, getPagePreview };
