import { version } from '../package.json';

export const DATA_ELEM_SELECTOR = '.ilh-all:not(.ilh-blue)';
export const GREEN_ANCHOR_SELECTOR = '.ilh-all:not(.ilh-blue) a';
export const ILH_LANG_SELECTOR = '.ilh-lang';
export const INTERWIKI_A_SELECTOR = `.ilh-link > a`;
export const ROOT_CLASS_DESKTOP = 'ilhpp-popup-desktop';
export const ROOT_CLASS_MOBILE = 'ilhpp-popup-mobile';
export const API_USER_AGENT = `Gadget-ilhpp/${version}`;

// Desktop popup specific
export const PAGE_POPUP_PADDING_PX = 10;
export const PTR_SHORT_SIDE_LENGTH_PX = 20; // Must sync with LESS @pointer-short-side-length!
export const PTR_WIDTH_PX = 8; // Must sync with LESS @pointer-width!
export const ATTACH_DELAY_MS = 150;
export const DETACH_DELAY_MS = 300;
export const DETACH_ANIMATION_MS = 200; // Must sync with LESS out animation time!

export const PREFETCH_MAX_WAIT = 500;

export const RTL_LANGS = [
  'ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'dv', 'syr',
];

