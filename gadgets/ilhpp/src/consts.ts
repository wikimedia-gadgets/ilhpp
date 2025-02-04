import { version } from '../package.json';

export const DATA_ELEM_SELECTOR = '.ilh-all:not(.ilh-blue)';
export const ORIG_A_SELECTOR = '.ilh-all:not(.ilh-blue) .ilh-page > a'; // Intentionally avoid .new which is subject to change
export const FOREIGN_A_SELECTOR = `.ilh-all:not(.ilh-blue) .ilh-link > a`; // Intentionally avoid .extiw which is subject to change
export const ILH_LANG_SELECTOR = '.ilh-lang';
export const ROOT_CLASS_DESKTOP = 'ilhpp-popup-desktop';
export const ROOT_CLASS_MOBILE = 'ilhpp-popup-mobile';
export const OVERLAY_CLASS_MOBILE = 'ilhpp-mobile-overlay';
export const API_USER_AGENT = `Gadget-ilhpp/${version}`;
export const PREF_KEY_LS = 'ilhpp-prefs'; // Used in local storage
export const PREF_KEY_MW = 'userjs-ilhpp-prefs'; // Used in MediaWiki user options
export const RTL_LANGS = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'dv', 'syr'];
// https://meta.wikimedia.org/wiki/Special_language_codes#Subdomains_that_do_not_match_their_lang_attribute
export const LANG_WIKI_MAP = {
  gsw: 'als',
  bho: 'bh',
  rup: 'roa-rup',
  lzh: 'zh-classical',
  nan: 'zh-min-nan',
  yue: 'zh-yue',
};
export const FOOTER_ANCHOR_ID = 'ilhpp-footer-places-settings';
export const NAV_POPUP_OPTION_NAME = 'gadget-Navigation_popups';

// Desktop popup specific
export const DT_PAGE_POPUP_PADDING_PX = 10;
export const DT_PTR_SHORT_SIDE_LENGTH_PX = 20; // Must sync with LESS @desktop-popup-pointer-short-side-length!
export const DT_PTR_WIDTH_PX = 8; // Must sync with LESS @desktop-popup-pointer-with!
export const DT_ATTACH_DELAY_MS = 300;
export const DT_DETACH_DELAY_MS = 300;
export const DT_DETACH_ANIMATION_MS = 200; // Must sync with LESS out animation time!

// Mobile popup specific
export const MB_SKELETON_STRIPE_COUNT = 6; // Must keep in sync with styles in popups_mobile.less!
export const MB_DETACH_ANIMATION_MS = 400; // Must sync with LESS out animation time!
