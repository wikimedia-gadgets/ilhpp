// Not present in TS right now: https://github.com/microsoft/TypeScript/pull/60656
// FIXME: Remove in the future
declare namespace Intl {
  interface Locale {
    /**
     * Returns the ordering of characters indicated by either ltr (left-to-right) or by rtl (right-to-left) for this locale.
     *
     * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getTextInfo)
     */
    getTextInfo(): TextInfo;

    textInfo: TextInfo;
  }

  interface TextInfo {
    direction: 'ltr' | 'rtl';
  }
}

declare module 'mobile.startup' {
  export function getOverlayManager(): void; // Return value unused
}
